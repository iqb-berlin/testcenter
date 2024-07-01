import { Component, OnInit } from '@angular/core';
import { TestControllerService } from '../../services/test-controller.service';
import { CustomtextService, MainDataService } from '../../../shared/shared.module';
import { AppError } from '../../../app.interfaces';
import { TestControllerState } from '../../interfaces/test-controller.interfaces';

@Component({
  templateUrl: './test-status.component.html',
  styleUrls: ['./test-status.component.css']
})

export class TestStatusComponent implements OnInit {
  loginName = '??';

  constructor(
    public tcs: TestControllerService,
    public mainDataService: MainDataService,
    private cts: CustomtextService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      const authData = this.mainDataService.getAuthData();
      if (authData) {
        this.loginName = authData.displayName;
      }
    });
  }

  reloadPage(error: AppError): void {
    this.mainDataService.reloadPage(error.type === 'session');
  }

  terminateTest(): void {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE', true, this.tcs.bookletConfig.lock_test_on_termination === 'ON');
    this.cts.restoreDefault(false);
  }

  continueTest() {
    this.tcs.setUnitNavigationRequest(this.tcs.currentUnitSequenceId.toString(10));
  }
}
