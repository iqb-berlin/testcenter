import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TestControllerComponent } from '../components/test-controller/test-controller.component';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerService } from '../services/test-controller.service';

export const testControllerDeactivateGuard: CanDeactivateFn<TestControllerComponent> = async (
  _component, currentRoute, _currentState, nextState
) => {
  const tcs = inject(TestControllerService);

  // If we're currently on a unit page, unitDeactivateGuard is also being checked for this same
  // navigation. Await the SAME (memoized) check it uses instead of deciding independently here.
  const leavingUnitPage = currentRoute.firstChild?.component === UnithostComponent;
  if (leavingUnitPage) {
    const unitLeaveAllowed = await firstValueFrom(tcs.getUnitDeactivationCheck(nextState.url));
    if (!unitLeaveAllowed) {
      return false;
    }
  }

  // Actual "should we end the test, and does the user confirm that" logic lives on
  // TestControllerService. If the unit-level check above already showed a merged dialog and
  // ended the test (see willAlsoEndTest/resolveLeaveCheckResult), state$ is no longer
  // RUNNING/PAUSED by this point, so this simply no-ops instead of asking a second time.
  return tcs.confirmEndTestIfNeeded();
};
