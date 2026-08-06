import { Component, OnInit } from '@angular/core';
import {
  AsyncPipe, NgSwitch, NgSwitchCase
} from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {
  AlertComponent, CustomtextPipe, MainDataService
} from '@shared/shared.module';
import { TestControllerService } from '@app/test-controller';

@Component({
  templateUrl: './test-status.component.html',
  imports: [
    NgSwitch,
    MatCardModule,
    AsyncPipe,
    CustomtextPipe,
    NgSwitchCase,
    AlertComponent
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
}
