import { Component, OnDestroy, OnInit } from '@angular/core';
import { from, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { concatMap, map } from 'rxjs/operators';
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
  private getMonitorDataSubscription: Subscription = null;
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
      this.mds.setSpinnerOn();
      this.bs.getSessionData().subscribe(authDataUntyped => {
        if (typeof authDataUntyped === 'number') {
          this.mds.setSpinnerOff();
          return;
        }
        const authData = authDataUntyped as AuthData;
        if (!authData || !authData.token) {
          this.mds.setAuthData();
          this.mds.setSpinnerOff();
          return;
        }
        this.accessObjects = {};

        const scopeIdList: { [id: string]: { id: string, type: AuthAccessKeyType } } = {};
        [AuthAccessKeyType.TEST_GROUP_MONITOR, AuthAccessKeyType.TEST]
          .forEach(accessType => {
            this.accessObjects[accessType] = [];
            (authData.access[accessType] || [])
              .forEach(accessObjectId => {
                scopeIdList[accessObjectId] = { id: accessObjectId, type: accessType };
              });
          });

        if (this.getMonitorDataSubscription !== null) {
          this.getMonitorDataSubscription.unsubscribe();
        }

        this.getMonitorDataSubscription =
          from(Object.keys(scopeIdList))
            .pipe(
              map((accessType: AuthAccessKeyType) => scopeIdList[accessType]),
              concatMap(accessIdAndType => {
                if (accessIdAndType.type === AuthAccessKeyType.TEST_GROUP_MONITOR) {
                  return this.bs.getGroupData(accessIdAndType.id);
                }
                if (authData.access[AuthAccessKeyType.TEST]) {
                  return this.bs.getBookletData(accessIdAndType.id);
                }
                return null;
              })
            )
            .subscribe(
              (wsData: AccessObject) => {
                if (wsData) {
                  this.accessObjects[scopeIdList[wsData.id].type].push(wsData);
                }
              },
              () => this.mds.setSpinnerOff(),
              () => this.mds.setSpinnerOff()
            );

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
