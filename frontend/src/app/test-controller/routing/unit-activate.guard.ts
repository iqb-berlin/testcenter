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
    const targetUnitSequenceId: number = Number(route.params.u);
    const booklet = this.tcs.booklet;
    if (!booklet) {
      // unit-route got called before test is loaded. This happens on page-reload (F5).
      const testId = Number(route.parent?.params.t);
      if (!testId) {
        return this.router.parseUrl('/');
      }
      // ignore unit-id from route, because test will get last opened unit ID from testStatus.CURRENT_UNIT_ID
      return this.router.parseUrl(`/t/${testId}`);
    }

    try {
      this.tcs.getUnit(targetUnitSequenceId);
    } catch (e) {
      // a unit-nr was entered in the URl which does not exist
      this.messageService.showError(`Navigation zu Aufgabe ${targetUnitSequenceId} nicht möglich`);
      // looking for alternatives where to go
      await this.tcs.closeBuffer('canActivate');
      if (this.tcs.currentUnit && !TestControllerService.unitIsInaccessible(this.tcs.currentUnit)) {
        // current unit is accessible, so we just stay here
        return false;
      }
      const previousUnlockedUnit = this.tcs.navigationTargets.previous;
      if (previousUnlockedUnit) {
        // a previous unit is accessible, so we go there
        return this.router.parseUrl(`/t/${this.tcs.testId}/u/${previousUnlockedUnit}`);
      }
    }

    // new unit is accessible, or we didn't have a good alternative where to go
    return true;
  }
}
