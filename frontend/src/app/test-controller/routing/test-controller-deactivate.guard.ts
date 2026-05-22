import { Injectable } from '@angular/core';
import { CanDeactivate, RedirectCommand, Router } from '@angular/router';
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

  async canDeactivate(): boolean {
    if (this.tcs.testMode.saveResponses) {
      const testStatus: TestControllerState = this.tcs.state$.getValue();
      const ignorePause = this.tcs.shouldShowConfirmationUI(); // at this moment in time, hideConfirmationUI comes with ignorePause for Logo Navigation
      if ((testStatus === 'RUNNING') || (testStatus === 'PAUSED' && !ignorePause)) {
        // this whole inner block mimics setUnitNavigationRequest(PAUSE), without manually triggering router.navigate()
        // in order to correctly return a redirect, instead of hacking (router.navigate + return false)
        if (!this.tcs.booklet) {
          return new RedirectCommand(
            this.router.parseUrl(`/t/${this.tcs.testId}/status`),
            { skipLocationChange: true, state: { force: true } }
          );
        }
        await this.tcs.closeAllBuffers(`setUnitNavigationRequest(${UnitNavigationTarget.PAUSE} NEXT`);
        return new RedirectCommand(
          this.router.parseUrl(`/t/${this.tcs.testId}/status`),
          { skipLocationChange: true, state: { force: true } }
        );
      }
    }
    return true;
  }
}
