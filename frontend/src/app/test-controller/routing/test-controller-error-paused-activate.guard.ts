import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { TestControllerService } from '../services/test-controller.service';

@Injectable()
export class TestControllerErrorPausedActivateGuard implements CanActivate {
  constructor(
    private tcs: TestControllerService
  ) {
  }

  canActivate(): boolean {
    return !['ERROR', 'TERMINATED', 'PAUSED'].includes(this.tcs.state$.getValue());
  }
}
