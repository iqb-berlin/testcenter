import { Injectable } from '@angular/core';

import { TestControllerState } from '../interfaces/test-controller.interfaces';
import { TestControllerService } from '../services/test-controller.service';

@Injectable()
export class TestControllerErrorPausedActivateGuard {
  constructor(
    private tcs: TestControllerService
  ) {
  }

  canActivate(): boolean {
    const testStatus: TestControllerState = this.tcs.state$.getValue();
    return (testStatus !== TestControllerState.ERROR) &&
      (testStatus !== TestControllerState.FINISHED) &&
      (testStatus !== TestControllerState.PAUSED);
  }
}
