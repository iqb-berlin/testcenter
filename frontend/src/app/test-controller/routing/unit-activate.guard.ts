import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, take, timer } from 'rxjs';
import { TestControllerService } from '../services/test-controller.service';
import { MessageService } from '../../shared/services/message.service';
import { MissingBookletError } from '../classes/missing-booklet-error.class';

@Injectable()
export class UnitActivateGuard {
  constructor(
    private tcs: TestControllerService,
    private router: Router,
    private messageService: MessageService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | boolean {
    const targetUnitSequenceId: number = Number(route.params.u);
    try {
      const booklet = this.tcs.booklet;
    } catch (err) {
      if ((err instanceof Error) && err.name !== 'MissingBookletError') {
        console.log('otha error');
        throw err;
      }
      // unit-route got called before test is loaded. This happens on page-reload (F5).
      const testId = Number(route.parent?.params.t);
      if (!testId) {
        this.router.navigate(['/']);
        return false;
      }
      // ignore unit-id from route, because test will get last opened unit ID from testStatus.CURRENT_UNIT_ID
      this.router.navigate([`/t/${testId}`]);
      return false;
    }
    const newUnit = this.tcs.getUnit(targetUnitSequenceId);
    if (!newUnit) {
      // a unit-nr was entered in the URl which does not exist
      this.messageService.showError(`Navigation zu Aufgabe ${targetUnitSequenceId} nicht möglich`);
      return false;
    }
    if (this.tcs.getUnitIsInaccessible(newUnit)) {
      // a unitId of a locked unit was inserted
      const previousUnlockedUnit = this.tcs.getNextUnlockedUnitSequenceId(newUnit.sequenceId, true);
      if (!previousUnlockedUnit) {
        return false;
      }
      if (previousUnlockedUnit !== targetUnitSequenceId) {
        this.router.navigate([`/t/${this.tcs.testId}/u/${previousUnlockedUnit}`]);
        return false;
      }
    }
    return true;
  }
}
