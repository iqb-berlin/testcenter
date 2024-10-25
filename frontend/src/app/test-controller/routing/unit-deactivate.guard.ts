import {
  concatMap, last, map, takeWhile
} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanDeactivate, Router, RouterStateSnapshot
} from '@angular/router';
import { from, Observable, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ConfirmDialogComponent, ConfirmDialogData, CustomtextService
} from '../../shared/shared.module';
import { Unit } from '../interfaces/test-controller.interfaces';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerService } from '../services/test-controller.service';
import { VeronaNavigationDeniedReason } from '../interfaces/verona.interfaces';

@Injectable()
export class UnitDeactivateGuard implements CanDeactivate<UnithostComponent> {
  constructor(
    private tcs: TestControllerService,
    private cts: CustomtextService,
    public confirmDialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  private checkAndSolveTimer(currentUnit: Unit, newUnit: Unit | null): Observable<boolean> {
    if (!this.tcs.currentTimerId) { // leaving unit is not in a timed block
      return of(true);
    }
    if (newUnit && newUnit.parent.timerId && // staying in the same timed block
      (newUnit.parent.timerId === this.tcs.currentTimerId)
    ) {
      return of(true);
    }
    if (this.tcs.testlets[this.tcs.currentTimerId].restrictions.timeMax?.leave === 'forbidden') {
      this.snackBar.open(
        'Es darf erst weiter geblättert werden, wenn die Zeit abgelaufen ist.',
        'OK',
        { duration: 3000 }
      );
      return of(false);
    }
    if (!this.tcs.testMode.forceTimeRestrictions) {
      this.tcs.interruptTimer();
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
            return false;
          }
          this.tcs.cancelTimer(); // does locking the block
          return true;
        })
      );
  }

  private checkAndSolveCompleteness(currentUnit: Unit, newUnit: Unit | null): Observable<boolean> {
    const direction = (!newUnit || currentUnit.sequenceId < newUnit.sequenceId) ? 'next' : 'previous';
    const reasons = this.tcs.checkCompleteness(currentUnit, direction);
    if (!reasons.length) {
      return of(true);
    }
    return this.notifyNavigationDenied(currentUnit, reasons, direction);
  }

  private notifyNavigationDenied(
    currentUnit: Unit,
    reasons: VeronaNavigationDeniedReason[],
    dir: 'next' | 'previous'
  ): Observable<boolean> {
    if (this.tcs.testMode.forceNaviRestrictions) {
      this.tcs.notifyNavigationDenied(currentUnit.sequenceId, reasons);

      const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogData>{
          title: this.cts.getCustomText('booklet_msgNavigationDeniedTitle'),
          content: reasons
            .map(r => this.cts.getCustomText(`booklet_msgNavigationDeniedText_${r}`))
            .join(' '),
          confirmbuttonlabel: 'OK',
          confirmbuttonreturn: false,
          showcancel: false
        }
      });
      return dialogCDRef.afterClosed().pipe(map(() => false));
    }
    const reasonTexts = {
      presentationIncomplete: 'Es wurde nicht alles gesehen oder abgespielt.',
      responsesIncomplete: 'Es wurde nicht alles bearbeitet.'
    };
    this.snackBar.open(
      `Im Testmodus dürfte hier nicht ${(dir === 'next') ? 'weiter' : ' zurück'} geblättert
                werden: ${reasons.map(r => reasonTexts[r]).join(' ')}.`,
      'OK',
      { duration: 3000 }
    );
    return of(true);
  }

  private checkAndSolveLeaveLocks(currentUnit: Unit, newUnit: Unit | null): Observable<boolean> {
    if (!currentUnit.parent.restrictions.lockAfterLeaving) {
      return of(true);
    }

    const lockScope = currentUnit.parent.restrictions.lockAfterLeaving.scope;

    if ((lockScope === 'testlet') && (newUnit?.parent.id === currentUnit.parent.id)) {
      return of(true);
    }

    const leaveLock = () => {
      if (this.tcs.testMode.forceNaviRestrictions) {
        if (lockScope === 'testlet') {
          this.tcs.leaveLockTestlet(currentUnit.parent.id);
        }
        if (lockScope === 'unit') {
          this.tcs.leaveLockUnit(currentUnit.sequenceId);
        }
      } else {
        this.snackBar.open(
          `${lockScope} würde im Testmodus nun gesperrt werden.`,
          'OK',
          { duration: 3000 }
        );
      }
    };

    if (currentUnit.parent.restrictions.lockAfterLeaving.confirm) {
      const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogData>{
          title: this.cts.getCustomText(`booklet_warningLeaveTitle-${lockScope}`),
          content: this.cts.getCustomText(`booklet_warningLeaveTextPrompt-${lockScope}`),
          confirmbuttonlabel: 'Trotzdem weiter',
          confirmbuttonreturn: true,
          showcancel: true
        }
      });
      return dialogCDRef.afterClosed()
        .pipe(
          map(cdresult => {
            if ((typeof cdresult === 'undefined') || (cdresult === false)) {
              return false;
            }
            leaveLock();
            return true;
          })
        );
    }
    leaveLock();
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
    if (this.tcs.state$.getValue() === 'ERROR') {
      return of(true);
    }

    if (!this.tcs.currentUnit) {
      return of(true);
    }

    const currentUnit = this.tcs.currentUnit;

    if (this.tcs.currentUnit.parent.locked) {
      return of(true);
    }

    let newUnit: Unit | null = null;
    const match = nextState.url.match(/t\/(\d+)\/u\/(\d+)$/);
    if (match) {
      const targetUnitSequenceId = Number(match[2]);
      newUnit = this.tcs.units[targetUnitSequenceId] || null;
    }

    // TODO maybe move all of this into testControllerService

    const forceNavigation = this.router.getCurrentNavigation()?.extras?.state?.force ?? false;
    if (forceNavigation) {
      this.tcs.interruptTimer();
      return of(true);
    }

    return from([
      this.checkAndSolveCompleteness.bind(this),
      this.checkAndSolveTimer.bind(this),
      this.checkAndSolveLeaveLocks.bind(this)
    ])
      .pipe(
        concatMap(check => check(currentUnit, newUnit)),
        takeWhile(checkResult => checkResult, true),
        last()
      );
  }
}
