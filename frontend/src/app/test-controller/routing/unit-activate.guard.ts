import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanActivate, Router, UrlTree
} from '@angular/router';
import { TestControllerService } from '../services/test-controller.service';
import { MessageService } from '../../shared/services/message.service';

@Injectable()
export class UnitActivateGuard implements CanActivate {
  constructor(
    private tcs: TestControllerService,
    private router: Router,
    private messageService: MessageService
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    console.log('canActivate:', route.params.u);
    const targetUnitSequenceId: number = Number(route.params.u);
    const booklet = this.tcs.booklet;
    if (!booklet) {
      // unit-route got called before test is loaded. This happens on page-reload (F5).
      const testId = Number(route.parent?.params.t);
      if (!testId) {
        console.log('canActivate', 'noTestId', testId);
        return this.router.parseUrl('/');
      }
      console.log('canActivate', 'noBookelt', booklet);
      // ignore unit-id from route, because test will get last opened unit ID from testStatus.CURRENT_UNIT_ID
      return this.router.parseUrl(`/t/${testId}`);
    }
    const newUnit = this.tcs.getUnitSilent(targetUnitSequenceId);
    if (!newUnit) {
      console.log('canActivate', 'nonewUnit', newUnit);
      // a unit-nr was entered in the URl which does not exist
      this.messageService.showError(`Navigation zu Aufgabe ${targetUnitSequenceId} nicht möglich`);
      return false;
    }
    console.log('canActivate snu snu', route.params.u);
    const previousUnlockedUnit = await this.tcs.getNextUnlockedUnitSequenceId(newUnit.sequenceId, true, true);
    if (!previousUnlockedUnit) {
      console.log('canActivate', 'no previousUnlockedUnit', previousUnlockedUnit);
      // there is no alternative where to navigate, so we navigate on the locked one despite being locked
      return true;
    }
    if (previousUnlockedUnit !== targetUnitSequenceId) {
      console.log('canActivate', 'same', previousUnlockedUnit, targetUnitSequenceId);
      // the unit is not accessible, but a previous one
      return this.router.parseUrl(`/t/${this.tcs.testId}/u/${previousUnlockedUnit}`);
    }
    return true;
  }
}
