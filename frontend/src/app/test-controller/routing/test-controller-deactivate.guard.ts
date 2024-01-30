import { Injectable } from '@angular/core';
import { TestControllerState, UnitNavigationTarget } from '../interfaces/test-controller.interfaces';
import { TestControllerService } from '../services/test-controller.service';

@Injectable()
export class TestControllerDeactivateGuard {
  constructor(
    private tcs: TestControllerService
  ) {
  }

  canDeactivate(): boolean {
    if (this.tcs.testMode.saveResponses) {
      const testStatus: TestControllerState = this.tcs.state$.getValue();
      if ((testStatus === TestControllerState.RUNNING) || (testStatus === TestControllerState.PAUSED)) {
        this.tcs.setUnitNavigationRequest(UnitNavigationTarget.PAUSE);
        return false;
      }
    }
    return true;
  }
}
