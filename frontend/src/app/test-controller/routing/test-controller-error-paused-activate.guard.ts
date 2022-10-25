import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { TestControllerState } from '../interfaces/test-controller.interfaces';
import { TestControllerService } from '../services/test-controller.service';

@Injectable()
export class TestControllerErrorPausedActivateGuard implements CanActivate {
  constructor(
    private tcs: TestControllerService
  ) {
  }

  canActivate(): boolean {
    const testStatus: TestControllerState = this.tcs.testStatus$.getValue();
    return (testStatus !== TestControllerState.ERROR) &&
      (testStatus !== TestControllerState.FINISHED) &&
      (testStatus !== TestControllerState.PAUSED);
  }
}
