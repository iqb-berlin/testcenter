import { Component, OnDestroy, OnInit } from '@angular/core';
import { from, Subscription } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { BackendService } from '../../backend.service';
import { MainDataService } from '../../shared/shared.module';
import { AuthAccessKeyType, AuthData, BookletData } from '../../app.interfaces';

@Component({
  templateUrl: './test-starter.component.html',
  styleUrls: ['./test-starter.component.css']
})
export class TestStarterComponent implements OnInit, OnDestroy {
  booklets: BookletData[] = [];
  bookletCount = 0;
  private getBookletDataSubscription: Subscription = null;

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
      }
      if (authData.access[AuthAccessKeyType.TEST]) {
        this.booklets = [];
        if (this.getBookletDataSubscription !== null) {
          this.getBookletDataSubscription.unsubscribe();
        }
        this.getBookletDataSubscription = from(authData.access[AuthAccessKeyType.TEST])
          .pipe(
            concatMap(bookletId => this.bs.getBookletData(bookletId))
          ).subscribe({
            next: bData => {
              this.booklets.push(bData);
              if (!(bData as BookletData).locked) {
                this.bookletCount += 1;
              }
            },
            complete: () => {
              this.mds.setSpinnerOff();
            }
          });
      }
      this.mds.setAuthData(authData);
    });
  }

  startTest(b: BookletData): void {
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
