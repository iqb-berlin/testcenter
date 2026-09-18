import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TestControllerComponent } from '../components/test-controller/test-controller.component';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerService } from '../services/test-controller.service';

@Injectable()
export class TestControllerDeactivateGuard implements CanDeactivate<TestControllerComponent> {
  constructor(private tcs: TestControllerService) {}

  async canDeactivate(
    _component: TestControllerComponent,
    currentRoute: ActivatedRouteSnapshot,
    _currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ) {
    // If we're currently on a unit page, UnitDeactivateGuard is also being checked for this same
    // navigation. Await the SAME (memoized) check it uses instead of deciding independently here.
    const leavingUnitPage = currentRoute.firstChild?.component === UnithostComponent;
    if (leavingUnitPage) {
      const unitLeaveAllowed = await firstValueFrom(this.tcs.getUnitDeactivationCheck(nextState.url));
      if (!unitLeaveAllowed) {
        return false;
      }
    }

    // Actual "should we end the test, and does the user confirm that" logic lives on
    // TestControllerService. If the unit-level check above already showed a merged dialog and
    // ended the test (see willAlsoEndTest/resolveLeaveCheckResult), state$ is no longer
    // RUNNING/PAUSED by this point, so this simply no-ops instead of asking a second time.
    return this.tcs.confirmEndTestIfNeeded();
  }
}
