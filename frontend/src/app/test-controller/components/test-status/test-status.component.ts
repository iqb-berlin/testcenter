import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TestControllerService } from '../../services/test-controller.service';
import { MainDataService } from '../../../shared/shared.module';
import { AppError } from '../../../app.interfaces';

@Component({
  templateUrl: './test-status.component.html',
  styleUrls: ['./test-status.component.css']
})

export class TestStatusComponent implements OnInit, OnDestroy {
  loginName = '??';
  error: AppError;
  errorDetailsOpen = false;
  private appErrorSubscription: Subscription;

  constructor(
    public tcs: TestControllerService,
    public mds: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      const authData = MainDataService.getAuthData();
      if (authData) {
        this.loginName = authData.displayName;
      }
      this.appErrorSubscription = this.mds.appError$
        .pipe(filter(error => !!error))
        .subscribe(error => {
          // This happens, when in lazy-loading-mode, an error occurred during the loading of the unit's content.
          // The error is caught here because
          // a) it can not get caught in testcontroller.component oder test-loader.service,
          // because the test-loading-promise is already completed when the unit's content gets loaded.
          // b) the error becomes visible when the units has been entered, not when it occurred.
          this.errorDetailsOpen = false;
          this.error = error;
        });
    });
  }

  ngOnDestroy(): void {
    this.appErrorSubscription.unsubscribe();
  }

  toggleErrorDetails(): void {
    this.errorDetailsOpen = !this.errorDetailsOpen;
  }

  terminateTest(): void {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE', true, this.tcs.bookletConfig.lock_test_on_termination === 'ON');
  }
}
