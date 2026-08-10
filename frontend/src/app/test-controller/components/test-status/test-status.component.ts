import { Component, OnInit } from '@angular/core';
import {
  AsyncPipe, NgSwitch, NgSwitchCase
} from '@angular/common';
import { MatCardModule } from '@angular/material/card';
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
    public mainDataService: MainDataService) { }

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
}
