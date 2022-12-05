import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { BackendService } from '../../backend.service';
import { MainDataService } from '../../shared/shared.module';
import { AccessObject, AuthAccessKeyType, AuthData } from '../../app.interfaces';

@Component({
  templateUrl: './test-starter.component.html',
  styleUrls: ['./test-starter.component.css']
})
export class TestStarterComponent implements OnInit, OnDestroy {
  booklets: AccessObject[] = [];
  bookletCount = 0;
  private getBookletDataSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private bs: BackendService,
    public mds: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => this.reloadTestList());
  }

  private reloadTestList(): void {
    this.mds.appSubTitle$.next('Testauswahl');
    this.mds.showLoadingAnimation();
    this.bs.getSessionData().subscribe(authDataUntyped => {
      if (typeof authDataUntyped === 'number') {
        this.mds.stopLoadingAnimation();
        return;
      }
      const authData = authDataUntyped as AuthData;
      if (!authData || !authData.token) {
        this.mds.setAuthData();
        this.mds.stopLoadingAnimation();
      }
      this.booklets = authData.access[AuthAccessKeyType.TEST];
      this.mds.setAuthData(authData);
      this.mds.stopLoadingAnimation();
    });
  }

  startTest(b: AccessObject): void {
    this.bs.startTest(b.id).subscribe(testId => {
      if (typeof testId === 'number') {
        this.reloadTestList();
      } else {
        this.router.navigate(['/t', testId]);
      }
    });
  }

  resetLogin(): void {
    this.mds.setAuthData();
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.getBookletDataSubscription !== null) {
      this.getBookletDataSubscription.unsubscribe();
    }
  }
}
