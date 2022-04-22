/* eslint-disable max-classes-per-file,no-console */

import { map, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanActivate, CanDeactivate, Router, RouterStateSnapshot
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ConfirmDialogComponent, ConfirmDialogData, CustomtextService, MainDataService
} from '../../shared/shared.module';
import { NavigationLeaveRestrictionValue, TestControllerState } from '../interfaces/test-controller.interfaces';
import { UnitControllerData } from '../classes/test-controller.classes';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerService } from '../services/test-controller.service';
import { VeronaNavigationDeniedReason } from '../interfaces/verona.interfaces';
import { LocalStorage } from '../utils/local-storage.util';

@Injectable()
export class UnitActivateGuard implements CanActivate {
  constructor(
    private tcs: TestControllerService,
    private mds: MainDataService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | boolean {
    const targetUnitSequenceId: number = Number(route.params.u);
    if (this.tcs.rootTestlet === null) {
      const oldTestId = LocalStorage.getTestId();
      if (oldTestId) {
        this.router.navigate([`/t/${oldTestId}`]);
      } else {
        this.router.navigate(['/']);
      }
      return false;
    }
    const newUnit: UnitControllerData = this.tcs.rootTestlet.getUnitAt(targetUnitSequenceId);
    if (!newUnit) {
      console.warn(`target unit null (targetUnitSequenceId: ${targetUnitSequenceId.toString()})`);
      return false;
    }
    return true;
  }
}

@Injectable()
export class UnitDeactivateGuard implements CanDeactivate<UnithostComponent> {
  constructor(
    private tcs: TestControllerService,
    private cts: CustomtextService,
    public confirmDialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  private checkAndSolveMaxTime(newUnit: UnitControllerData): Observable<boolean> {
    if (!this.tcs.currentMaxTimerTestletId) { // leaving unit is not in a timed block
      return of(true);
    }
    if (newUnit && newUnit.maxTimerRequiringTestlet && // staying in the same timed block
      (newUnit.maxTimerRequiringTestlet.id === this.tcs.currentMaxTimerTestletId)
    ) {
      return of(true);
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

  private checkAndSolveCompleteness(newUnit: UnitControllerData): Observable<boolean> {
    const direction = (newUnit && this.tcs.currentUnitSequenceId < newUnit.unitDef.sequenceId) ? 'Next' : 'Prev';
    const reasons = this.checkCompleteness(direction);
    if (!reasons.length) {
      return of(true);
    }
    return this.notifyNavigationDenied(reasons, direction);
  }

  private checkCompleteness(direction: 'Next' | 'Prev'): VeronaNavigationDeniedReason[] {
    const unit = this.tcs.rootTestlet.getUnitAt(this.tcs.currentUnitSequenceId);
    if (unit.unitDef.locked) {
      return [];
    }
    const reasons: VeronaNavigationDeniedReason[] = [];
    const checkOnValue = {
      Next: <NavigationLeaveRestrictionValue[]>['ON', 'ALWAYS'],
      Prev: <NavigationLeaveRestrictionValue[]>['ALWAYS']
    };
    if (
      (checkOnValue[direction].indexOf(unit.unitDef.navigationLeaveRestrictions.presentationComplete) > -1) &&
      this.tcs.hasUnitPresentationProgress(this.tcs.currentUnitSequenceId) &&
      (this.tcs.getUnitPresentationProgress(this.tcs.currentUnitSequenceId) !== 'complete')
    ) {
      reasons.push('presentationIncomplete');
    }
    if (
      (checkOnValue[direction].indexOf(unit.unitDef.navigationLeaveRestrictions.responseComplete) > -1) &&
      this.tcs.hasUnitResponseProgress(this.tcs.currentUnitSequenceId) &&
      (['complete', 'complete-and-valid']
        .indexOf(this.tcs.getUnitResponseProgress(this.tcs.currentUnitSequenceId)) === -1
      )
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
      presentationIncomplete: 'Es wurde nicht alles gesehen/abgespielt.',
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

  canDeactivate(component: UnithostComponent, currentRoute: ActivatedRouteSnapshot,
                currentState: RouterStateSnapshot, nextState: RouterStateSnapshot): Observable<boolean> | boolean {
    if (this.tcs.testStatus$.getValue() === TestControllerState.ERROR) {
      return true;
    }

    if (nextState.url === '/r/route-dispatcher') { // clicking on the IQB-Logo
      return true;
    }

    const currentUnit = this.tcs.rootTestlet.getUnitAt(this.tcs.currentUnitSequenceId);
    if (currentUnit && currentUnit.codeRequiringTestlets.length) {
      return true;
    }

    let newUnit: UnitControllerData = null;
    if (/t\/\d+\/u\/\d+$/.test(nextState.url)) {
      const targetUnitSequenceId = Number(nextState.url.match(/\d+$/)[0]);
      newUnit = this.tcs.rootTestlet.getUnitAt(targetUnitSequenceId);
    }

    const forceNavigation = this.router.getCurrentNavigation().extras?.state?.force ?? false;
    if (forceNavigation) {
      this.tcs.interruptMaxTimer();
      return of(true);
    }

    return this.checkAndSolveCompleteness(newUnit)
      .pipe(
        switchMap(cAsC => (!cAsC ? of(false) : this.checkAndSolveMaxTime(newUnit)))
      );
  }
}

export const unitRouteGuards = [UnitActivateGuard, UnitDeactivateGuard];
