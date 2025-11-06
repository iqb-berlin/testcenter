import { Component, OnInit, OnDestroy } from '@angular/core';
import { TestControllerService } from '../../services/test-controller.service';
import { CustomtextService, MainDataService } from '../../../shared/shared.module';
import { AppError } from '../../../app.interfaces';
import { UiVisibilityService } from '../../../shared/services/ui-visibility.service';

@Component({
    templateUrl: './test-status.component.html',
    styleUrls: ['./test-status.component.css'],
    standalone: false
})

export class TestStatusComponent implements OnInit, OnDestroy {
  loginName = '??';
  private previousShowLogoState: boolean = true; // AIDEV-NOTE: Store previous logo state to restore on destroy

  constructor(
    public tcs: TestControllerService,
    public mainDataService: MainDataService,
    private cts: CustomtextService,
    private uiVisibilityService: UiVisibilityService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      const authData = this.mainDataService.getAuthData();
      if (authData) {
        this.loginName = authData.displayName;
      }

      this.uiVisibilityService.showConfirmationUI$.subscribe(currentState => {
        this.previousShowLogoState = currentState;
      }).unsubscribe(); // Get current state immediately and unsubscribe, no need for unsubscribe in ngOnDestroy
      this.uiVisibilityService.setShowConfirmationUI(true);
    });
  }

  reloadPage(error: AppError): void {
    this.mainDataService.reloadPage(error.type === 'session');
  }

  terminateTest(): void {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE', true, this.tcs.booklet?.config.lock_test_on_termination === 'ON');
    this.cts.restoreDefault(false);
  }

  continueTest() {
    this.tcs.setUnitNavigationRequest(this.tcs.currentUnitSequenceId.toString(10));
  }

  ngOnDestroy(): void {
    this.uiVisibilityService.setShowConfirmationUI(this.previousShowLogoState);
  }
}
