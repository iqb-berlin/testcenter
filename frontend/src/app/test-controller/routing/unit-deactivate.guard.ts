import { map, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ConfirmDialogComponent, ConfirmDialogData, CustomtextService
} from '../../shared/shared.module';
import { NavigationLeaveRestrictionValue, TestControllerState } from '../interfaces/test-controller.interfaces';
import { UnitWithContext } from '../classes/test-controller.classes';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerService } from '../services/test-controller.service';
import { VeronaNavigationDeniedReason } from '../interfaces/verona.interfaces';

@Injectable()
export class UnitDeactivateGuard {
  constructor(
    private tcs: TestControllerService,
    private cts: CustomtextService,
    public confirmDialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  private checkAndSolveMaxTime(newUnit: UnitWithContext | null): Observable<boolean> {
    if (!this.tcs.currentMaxTimerTestletId) { // leaving unit is not in a timed block
      return of(true);
    }
    if (newUnit && newUnit.maxTimerRequiringTestlet && // staying in the same timed block
      (newUnit.maxTimerRequiringTestlet.id === this.tcs.currentMaxTimerTestletId)
    ) {
      return of(true);
    }
    if (this.tcs.rootTestlet?.getTestlet(this.tcs.currentMaxTimerTestletId)?.maxTimeLeave === 'forbidden') {
      this.snackBar.open(
        `Es darf erst weiter geblättert werden, wenn die Zeit abgelaufen ist.`,
        'OK',
        { duration: 3000 }
      );
      return of(false);
    }
    if (!this.tcs.testMode.forceTimeRestrictions) {
      this.tcs.interruptMaxTimer();
      return of(true);
    }

    const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: <ConfirmDialogData>{
        title: this.cts.getCustomText('booklet_warningLeaveTimerBlockTitle'),
        content: this.cts.getCustomText('booklet_warningLeaveTimerBlockTextPrompt'),
        confirmbuttonlabel: 'Trotzdem weiter',
        confirmbuttonreturn: true,
        showcancel: true
      }
    });
    return dialogCDRef.afterClosed()
      .pipe(
        map(cdresult => {
          if ((typeof cdresult === 'undefined') || (cdresult === false)) {
            // eslint-disable-next-line no-self-assign
            this.tcs.currentUnitSequenceId = this.tcs.currentUnitSequenceId; // to refresh menu
            return false;
          }
          this.tcs.cancelMaxTimer(); // does locking the block
          return true;
        })
      );
  }

  private checkAndSolveCompleteness(newUnit: UnitWithContext | null): Observable<boolean> {
    const direction = (!newUnit || this.tcs.currentUnitSequenceId < newUnit.unitDef.sequenceId) ? 'Next' : 'Prev';
    const reasons = this.checkCompleteness(direction);
    if (!reasons.length) {
      return of(true);
    }
    return this.notifyNavigationDenied(reasons, direction);
  }

  private checkCompleteness(direction: 'Next' | 'Prev'): VeronaNavigationDeniedReason[] {
    const unit = this.tcs.getUnitWithContext(this.tcs.currentUnitSequenceId);
    if (unit.unitDef.lockedByTime) {
      return [];
    }
    const reasons: VeronaNavigationDeniedReason[] = [];
    const checkOnValue = {
      Next: <NavigationLeaveRestrictionValue[]>['ON', 'ALWAYS'],
      Prev: <NavigationLeaveRestrictionValue[]>['ALWAYS']
    };
    if (
      (checkOnValue[direction].indexOf(unit.unitDef.navigationLeaveRestrictions.presentationComplete) > -1) &&
      (this.tcs.getUnitPresentationProgress(this.tcs.currentUnitSequenceId) !== 'complete')
    ) {
      reasons.push('presentationIncomplete');
    }
    const currentUnitResponseProgress = this.tcs.getUnitResponseProgress(this.tcs.currentUnitSequenceId);
    if (
      (checkOnValue[direction].indexOf(unit.unitDef.navigationLeaveRestrictions.responseComplete) > -1) &&
      currentUnitResponseProgress &&
      (['complete', 'complete-and-valid'].indexOf(currentUnitResponseProgress) === -1)
    ) {
      reasons.push('responsesIncomplete');
    }
    return reasons;
  }

  private notifyNavigationDenied(reasons: VeronaNavigationDeniedReason[], dir: 'Next' | 'Prev'): Observable<boolean> {
    if (this.tcs.testMode.forceNaviRestrictions) {
      this.tcs.notifyNavigationDenied(this.tcs.currentUnitSequenceId, reasons);

      const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogData>{
          title: this.cts.getCustomText('booklet_msgNavigationDeniedTitle'),
          content: reasons.map(r => this.cts.getCustomText(`booklet_msgNavigationDeniedText_${r}`)).join(' '),
          confirmbuttonlabel: 'OK',
          confirmbuttonreturn: false,
          showcancel: false
        }
      });
      return dialogCDRef.afterClosed().pipe(map(() => {
        // eslint-disable-next-line no-self-assign
        this.tcs.currentUnitSequenceId = this.tcs.currentUnitSequenceId; // to refresh menu
        return false;
      }));
    }
    const reasonTexts = {
      presentationIncomplete: 'Es wurde nicht alles gesehen oder abgespielt.',
      responsesIncomplete: 'Es wurde nicht alles bearbeitet.'
    };
    this.snackBar.open(
      `Im Testmodus dürfte hier nicht ${(dir === 'Next') ? 'weiter' : ' zurück'}geblättert
                werden: ${reasons.map(r => reasonTexts[r]).join(' ')}.`,
      'Blättern',
      { duration: 3000 }
    );
    return of(true);
  }

  canDeactivate(
    component: UnithostComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    if (nextState.url === '/r/route-dispatcher') {
      return true;
    }

    if (this.tcs.testStatus$.getValue() === TestControllerState.ERROR) {
      return true;
    }

    const currentUnit = this.tcs.getUnitWithContextSilent(this.tcs.currentUnitSequenceId);
    if (currentUnit && this.tcs.getUnclearedTestlets(currentUnit).length) {
      return true;
    }

    let newUnit: UnitWithContext | null = null;
    const match = nextState.url.match(/t\/(\d+)\/u\/(\d+)$/);
    if (match) {
      const targetUnitSequenceId = Number(match[2]);
      newUnit = this.tcs.getUnitWithContextSilent(targetUnitSequenceId);
    }

    const forceNavigation = this.router.getCurrentNavigation()?.extras?.state?.force ?? false;
    if (forceNavigation) {
      this.tcs.interruptMaxTimer();
      return true;
    }

    return this.checkAndSolveCompleteness(newUnit)
      .pipe(
        switchMap(cAsC => (!cAsC ? of(false) : this.checkAndSolveMaxTime(newUnit as UnitWithContext)))
      );
  }
}
