import { Injectable } from '@angular/core';
import { CanDeactivate, RedirectCommand, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MessageService } from '@shared/services/message.service';
import { TestControllerState, UnitNavigationTarget } from '../interfaces/test-controller.interfaces';
import { TestControllerComponent } from '../components/test-controller/test-controller.component';
import { TestControllerService } from '../services/test-controller.service';
import { CustomtextService } from '@shared/services/customtext/customtext.service';

@Injectable()
export class TestControllerDeactivateGuard implements CanDeactivate<TestControllerComponent> {
  constructor(
    private tcs: TestControllerService,
    private messageService: MessageService,
    private cts: CustomtextService,
    private router: Router
  ) {
  }

  async canDeactivate() {
    if (this.tcs.testMode.saveResponses) {
      const testStatus: TestControllerState = this.tcs.state$.getValue();
      const ignorePause = this.tcs.shouldShowConfirmationUI(); // at this moment in time, hideConfirmationUI comes with ignorePause for Logo Navigation
      if ((testStatus === 'RUNNING') || (testStatus === 'PAUSED' && !ignorePause)) {
        // this whole inner block mimics setUnitNavigationRequest(PAUSE), without manually triggering router.navigate()
        // in order to correctly return a redirect, instead of hacking (router.navigate + return false)
        if (!this.tcs.booklet) {
          return new RedirectCommand(
            this.router.parseUrl(`/t/${this.tcs.testId}/status`),
            { skipLocationChange: true, state: { force: false } }
          );
        }
        const isLeaveConfirmed = await firstValueFrom(
          this.messageService.showConfirmDialog({
            title: 'Sicher, dass du den Test beenden möchtest?',
            content: ''
          })
        );
        if (isLeaveConfirmed) {
          await this.tcs.closeAllBuffers(`setUnitNavigationRequest(${UnitNavigationTarget.PAUSE} NEXT`);
          this.terminateTest();
        }
        return isLeaveConfirmed;
      }
    }
    return true;
  }

  terminateTest(): void {
    this.tcs.terminateTest(
      'BOOKLETLOCKEDbyTESTEE', true, this.tcs.booklet?.config.lock_test_on_termination === 'ON');
    this.cts.restoreDefault(false);
  }
}
