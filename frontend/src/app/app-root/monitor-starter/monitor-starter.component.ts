import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CustomtextService, MainDataService } from '../../shared/shared.module';
import { BackendService } from '../../backend.service';
import {
  AccessObject, AuthAccessKeyType, AuthData, BookletData
} from '../../app.interfaces';

@Component({
  templateUrl: './monitor-starter.component.html',
  styleUrls: ['./monitor-starter.component.css']
})
export class MonitorStarterComponent implements OnInit, OnDestroy {
  accessObjects: { [accessType: string]: (AccessObject | BookletData)[] } = {};
  private getMonitorDataSubscription: Subscription | null = null;
  AuthAccessKeyType = AuthAccessKeyType;
  problemText: string;

  constructor(
    private router: Router,
    private bs: BackendService,
    public cts: CustomtextService,
    public mds: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.appSubTitle$.next(this.cts.getCustomText('gm_headline'));

      this.bs.getSessionData().subscribe(authDataUntyped => {
        if (typeof authDataUntyped === 'number') {
          this.mds.stopLoadingAnimation();
          return;
        }
        const authData = authDataUntyped as AuthData;
        if (!authData || !authData.token) {
          this.mds.setAuthData();
          this.mds.stopLoadingAnimation();
          return;
        }
        this.accessObjects = {};

        [AuthAccessKeyType.TEST_GROUP_MONITOR, AuthAccessKeyType.TEST, AuthAccessKeyType.ATTACHMENT_MANAGER]
          .forEach(accessType => {
            this.accessObjects[accessType] = [];
            (authData.access[accessType] || [])
              .forEach(accessObjectId => {
                if (accessType === AuthAccessKeyType.TEST_GROUP_MONITOR) {
                  this.bs.getGroupData(accessObjectId)
                    .subscribe(idAndLabel => {
                      this.accessObjects[accessType].push(idAndLabel);
                    });
                }
                if (accessType === AuthAccessKeyType.ATTACHMENT_MANAGER) {
                  this.bs.getGroupData(accessObjectId)
                    .subscribe(idAndLabel => {
                      this.accessObjects[accessType].push(idAndLabel);
                    });
                }
                if (accessType === AuthAccessKeyType.TEST) {
                  this.bs.getBookletData(accessObjectId)
                    .subscribe(idAndLabel => {
                      this.accessObjects[accessType].push(idAndLabel);
                    });
                }
              });
          });

        this.mds.setAuthData(authData);
      });
    });
  }

  startTest(b: BookletData): void {
    this.bs.startTest(b.id).subscribe(testId => {
      if (typeof testId === 'number') {
        const errCode = testId as number;
        if (errCode === 423) {
          this.problemText = 'Dieser Test ist gesperrt';
        } else {
          this.problemText = `Problem beim Start (${errCode})`;
        }
      } else {
        this.router.navigate(['/t', testId]);
      }
    });
  }

  buttonGotoMonitor(accessObject: AccessObject): void {
    this.router.navigateByUrl(`/gm/${accessObject.id.toString()}`);
  }

  buttonGotoAttachmentManager(accessObject) {
    this.router.navigateByUrl(`/am/${accessObject.id.toString()}`);
  }

  resetLogin(): void {
    this.mds.setAuthData();
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.getMonitorDataSubscription !== null) {
      this.getMonitorDataSubscription.unsubscribe();
    }
  }
}
