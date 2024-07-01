import { Injectable } from '@angular/core';
import { CanDeactivate, Router } from '@angular/router';
import { TestControllerState, UnitNavigationTarget } from '../interfaces/test-controller.interfaces';
import { TestControllerService } from '../services/test-controller.service';
import { TestControllerComponent } from '../components/test-controller/test-controller.component';

@Injectable()
export class TestControllerDeactivateGuard implements CanDeactivate<TestControllerComponent> {
  constructor(
    private tcs: TestControllerService,
    private router: Router
  ) {
  }

  canDeactivate(): boolean {
    if (this.tcs.testMode.saveResponses) {
      const testStatus: TestControllerState = this.tcs.state$.getValue();
      if ((testStatus === 'RUNNING') || (testStatus === 'PAUSED')) {
        console.log('i am your father, luke');
        this.tcs.setUnitNavigationRequest(UnitNavigationTarget.PAUSE);
        return false;
      }
    }
    return true;
  }
}
