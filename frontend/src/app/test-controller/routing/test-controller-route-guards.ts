/* eslint-disable max-classes-per-file */

import { Injectable } from '@angular/core';
import { CanActivate, CanDeactivate } from '@angular/router';
import { TestControllerComponent } from '../components/test-controller/test-controller.component';
import { TestControllerState, UnitNavigationTarget } from '../interfaces/test-controller.interfaces';
import { TestControllerService } from '../services/test-controller.service';
import { LocalStorage } from '../utils/local-storage.util';

@Injectable()
export class TestControllerDeactivateGuard implements CanDeactivate<TestControllerComponent> {
  constructor(
    private tcs: TestControllerService
  ) {
  }

  canDeactivate(): boolean {
    if (this.tcs.testMode.saveResponses) {
      const testStatus: TestControllerState = this.tcs.testStatus$.getValue();
      if ((testStatus === TestControllerState.RUNNING) || (testStatus === TestControllerState.PAUSED)) {
        this.tcs.setUnitNavigationRequest(UnitNavigationTarget.PAUSE);
        return false;
      }
    }
    LocalStorage.removeTestId();
    return true;
  }
}

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

export const testControllerRouteGuards = [TestControllerDeactivateGuard, TestControllerErrorPausedActivateGuard];
