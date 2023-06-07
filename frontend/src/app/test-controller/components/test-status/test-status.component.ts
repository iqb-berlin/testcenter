import { Component, OnInit } from '@angular/core';
import { TestControllerService } from '../../services/test-controller.service';
import { CustomtextService, MainDataService } from '../../../shared/shared.module';

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

  reloadPage(): void {
    this.mainDataService.reloadPage();
  }

  terminateTest(): void {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE', true, this.tcs.bookletConfig.lock_test_on_termination === 'ON');
    this.cts.restoreDefault(false);
  }

  continueTest() {
    this.tcs.setUnitNavigationRequest(this.tcs.currentUnitSequenceId.toString(10));
  }
}
