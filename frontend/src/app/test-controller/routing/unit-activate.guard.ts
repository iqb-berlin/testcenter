import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TestControllerService } from '../services/test-controller.service';
import { MessageService } from '../../shared/services/message.service';
import { Unit } from '../interfaces/test-controller.interfaces';

export const unitActivateGuard: CanActivateFn = async route => {
  const tcs = inject(TestControllerService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  // unit-route got called before test is loaded. This happens on page-reload (F5).
  const booklet = tcs.booklet;
  if (!booklet) {
    const testId = Number(route.parent?.params.t);
    if (!testId) {
      return router.parseUrl('/');
    }
    // ignore unit-id from route, because test will get last opened unit ID from testStatus.CURRENT_UNIT_ID
    return router.parseUrl(`/t/${testId}`);
  }

  let targetUnit: Unit | undefined;
  const targetUnitSequenceId: number = Number(route.params.u);

  try {
    targetUnit = tcs.getUnit(targetUnitSequenceId);
  } catch {
    // a unit-nr was entered in the URL which does not exist
    if (tcs.shouldShowConfirmationUI()) {
      messageService.showSnackbar(`Navigation zu Aufgabe ${targetUnitSequenceId} nicht möglich`);
    }
    // looking for alternatives where to go
    const currentNavigation = await tcs.closeAllBuffers('canActivate');
    if (tcs.currentUnit && !TestControllerService.unitIsInaccessible(tcs.currentUnit)) {
      // current unit is accessible, so we just stay here
      return false;
    }
    if (currentNavigation.targets.previous) {
      // a previous unit is accessible, so we can go there
      return router.parseUrl(`/t/${tcs.testId}/u/${currentNavigation.targets.previous}`);
    }
    // we stay anyway (undefined behaviour on what happens on that unit)
    return false;
  }

  if (targetUnit && TestControllerService.unitIsInaccessible(targetUnit)) {
    // we navigate to a locked unit. example: we leave timed block to status and return.
    const navigation = tcs.getNavigationState(targetUnitSequenceId);
    if (navigation.targets.next) {
      // a later unit is accessible, so we go there
      return router.parseUrl(`/t/${tcs.testId}/u/${navigation.targets.next}`);
    }
  }

  // new unit is accessible, or we didn't have a good alternative where to go
  return true;
};
