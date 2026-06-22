import { Component, OnInit } from '@angular/core';
import {
  AsyncPipe, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault
} from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import {
  AlertComponent, CustomtextPipe, CustomtextService, MainDataService
} from '@shared/shared.module';
import { AppError } from '@app/app.interfaces';
import { ErrorComponent } from '@shared/components/error/error.component';
import { TestControllerService } from '@app/test-controller';

@Component({
  templateUrl: './test-status.component.html',
  imports: [
    NgSwitch,
    MatCardModule,
    AsyncPipe,
    NgSwitchDefault,
    NgIf,
    MatButton,
    CustomtextPipe,
    NgSwitchCase,
    AlertComponent,
    ErrorComponent
  ],
  styleUrls: ['./test-status.component.css']
})

export class TestStatusComponent implements OnInit {
  loginName = '??';

  constructor(
    public tcs: TestControllerService,
    public mainDataService: MainDataService,
    private cts: CustomtextService) { }

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
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE', true, this.tcs.booklet?.config.lock_test_on_termination === 'ON');
    this.cts.restoreDefault(false);
  }

  continueTest() {
    this.tcs.setUnitNavigationRequest(this.tcs.currentUnitSequenceId.toString(10));
  }
}
