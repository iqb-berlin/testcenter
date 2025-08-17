import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { TestControllerState, UnitNavigationTarget } from '../interfaces/test-controller.interfaces';
import { TestControllerService } from '../services/test-controller.service';
import { TestControllerComponent } from '../components/test-controller/test-controller.component';

@Injectable()
export class TestControllerDeactivateGuard implements CanDeactivate<TestControllerComponent> {
  constructor(
    private tcs: TestControllerService
  ) {
  }

  canDeactivate(): boolean {
    if (this.tcs.testMode.saveResponses) {
      const testStatus: TestControllerState = this.tcs.state$.getValue();
      const ignorePause = this.tcs.shouldShowConfirmationUI(); // at this moment in time, hideConfirmationUI comes with ignorePause for Logo Navigation
      if ((testStatus === 'RUNNING') || (testStatus === 'PAUSED' && !ignorePause)) {
        this.tcs.setUnitNavigationRequest(UnitNavigationTarget.PAUSE);
        return false;
      }
    }
    return true;
  }
}
