import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { TestControllerService } from '../services/test-controller.service';

export const testControllerErrorPausedActivateGuard: CanActivateFn = () => (
  !['ERROR', 'TERMINATED', 'PAUSED'].includes(inject(TestControllerService).state$.getValue())
);
