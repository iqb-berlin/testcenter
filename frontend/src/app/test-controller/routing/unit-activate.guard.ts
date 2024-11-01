import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanActivate, Router, UrlTree
} from '@angular/router';
import { TestControllerService } from '../services/test-controller.service';
import { MessageService } from '../../shared/services/message.service';
import { Unit } from '../interfaces/test-controller.interfaces';

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

    let targetUnit: Unit | undefined;

    try {
      targetUnit = this.tcs.getUnit(targetUnitSequenceId);
    } catch (e) {
      // a unit-nr was entered in the URL which does not exist
      this.messageService.showError(`Navigation zu Aufgabe ${targetUnitSequenceId} nicht möglich`);
      // looking for alternatives where to go
      await this.tcs.closeBuffer('canActivate');
      if (this.tcs.currentUnit && !TestControllerService.unitIsInaccessible(this.tcs.currentUnit)) {
        // current unit is accessible, so we just stay here
        return false;
      }
      if (this.tcs.navigation.targets.previous) {
        // a previous unit is accessible, so we go there
        return this.router.parseUrl(`/t/${this.tcs.testId}/u/${this.tcs.navigation.targets.previous}`);
      }
    }

    if (targetUnit && TestControllerService.unitIsInaccessible(targetUnit)) {
      // we navigate to a locked unit. example: we leave timed block to status and return.
      if (this.tcs.navigation.targets.next) {
        // a later unit is accessible, so we go there
        return this.router.parseUrl(`/t/${this.tcs.testId}/u/${this.tcs.navigation.targets.next}`);
      }
    }

    // new unit is accessible, or we didn't have a good alternative where to go
    return true;
  }
}
