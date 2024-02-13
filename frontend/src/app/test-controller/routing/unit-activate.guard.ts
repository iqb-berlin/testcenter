import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TestControllerService } from '../services/test-controller.service';
import { MessageService } from '../../shared/services/message.service';

@Injectable()
export class UnitActivateGuard {
  constructor(
    private tcs: TestControllerService,
    private router: Router,
    private messageService: MessageService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | boolean {
    const targetUnitSequenceId: number = Number(route.params.u);
    const booklet = this.tcs.booklet;
    if (!booklet) {
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
    if (TestControllerService.unitIsInaccessible(newUnit)) {
      // a unitId of a locked unit was inserted
      const previousUnlockedUnit = this.tcs.getNextUnlockedUnitSequenceId(newUnit.sequenceId, true);
      if (!previousUnlockedUnit) {
        return true;
      }
      if (previousUnlockedUnit !== targetUnitSequenceId) {
        this.router.navigate([`/t/${this.tcs.testId}/u/${previousUnlockedUnit}`]);
        return false;
      }
    }
    return true;
  }
}
