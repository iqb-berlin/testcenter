import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanActivate, RedirectCommand, Router, UrlTree
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

  async canActivate(route: ActivatedRouteSnapshot) {
    // unit-route got called before test is loaded. This happens on page-reload (F5).
    const booklet = this.tcs.booklet;
    if (!booklet) {
      const testId = Number(route.parent?.params.t);
      if (!testId) {
        return this.router.parseUrl('/');
      }
      // ignore unit-id from route, because test will get last opened unit ID from testStatus.CURRENT_UNIT_ID
      return this.router.parseUrl(`/t/${testId}`);
    }

    let targetUnit: Unit | undefined;
    const targetUnitSequenceId: number = Number(route.params.u);

    try {
      targetUnit = this.tcs.getUnit(targetUnitSequenceId);
    } catch (e) {
      // a unit-nr was entered in the URL which does not exist
      if (this.tcs.shouldShowConfirmationUI()) {
        this.messageService.showSnackbar(`Navigation zu Aufgabe ${targetUnitSequenceId} nicht möglich`);
      }
      // looking for alternatives where to go
      const currentNavigation = await this.tcs.closeAllBuffers('canActivate');
      if (this.tcs.currentUnit && !TestControllerService.unitIsInaccessible(this.tcs.currentUnit)) {
        // current unit is accessible, so we just stay here
        return false;
      }
      if (currentNavigation.targets.previous) {
        // a previous unit is accessible, so we can go there
        return this.router.parseUrl(`/t/${this.tcs.testId}/u/${currentNavigation.targets.previous}`);
      }
      // we stay anyway (undefined behaviour on what happens on that unit)
      return false;
    }

    if (targetUnit && TestControllerService.unitIsInaccessible(targetUnit)) {
      // we navigate to a locked unit. example: we leave timed block to status and return.
      const navigation = this.tcs.getNavigationState(targetUnitSequenceId);
      if (navigation.targets.next) {
        // a later unit is accessible, so we go there
        return this.router.parseUrl(`/t/${this.tcs.testId}/u/${navigation.targets.next}`);
      }
    }

    // new unit is accessible, or we didn't have a good alternative where to go
    return true;
  }
}
