import { Injectable } from '@angular/core';
import {
  BehaviorSubject, Observable, ReplaySubject, Subject
} from 'rxjs';
import { Router } from '@angular/router';
import { CustomtextService } from '../customtext/customtext.service';
import {
  AccessObject, AppError, AuthAccessType, AuthData
} from '../../../app.interfaces';
import { AppConfig } from '../../classes/app.config';
import { BackendService } from '../backend.service';

const localStorageAuthDataKey = 'iqb-tc-a';

@Injectable({
  providedIn: 'root'
})
export class MainDataService {
  appError$ = new ReplaySubject<AppError>(1);
  private _authData$ = new BehaviorSubject<AuthData | null>(null);
  get authData$(): Observable<AuthData | null> {
    return this._authData$.asObservable();
  }

  isSpinnerOn$ = new BehaviorSubject<boolean>(false);
  progressVisualEnabled = true;
  appConfig: AppConfig = null;
  sysCheckAvailable = false;
  appTitle$ = new BehaviorSubject<string>('IQB-Testcenter');
  appSubTitle$ = new BehaviorSubject<string>('');
  globalWarning = '';

  postMessage$ = new Subject<MessageEvent>();
  appWindowHasFocus$ = new Subject<boolean>();

  getAuthData(): AuthData {
    if (this._authData$.getValue()) {
      return this._authData$.getValue();
    }
    try {
      return JSON.parse(localStorage.getItem(localStorageAuthDataKey));
    } catch (e) {
      return null;
    }
  }

  getAccessObject(type: AuthAccessType, id: string): AccessObject {
    return this.getAuthData().claims[type].find(accessObject => accessObject.id === id);
  }

  constructor(
    private cts: CustomtextService,
    private bs: BackendService,
    private router: Router
  ) {
  }

  showLoadingAnimation(): void {
    this.isSpinnerOn$.next(true);
  }

  stopLoadingAnimation(): void {
    this.isSpinnerOn$.next(false);
  }

  setAuthData(authData: AuthData): void {
    this._authData$.next(authData);
    if (authData.customTexts) {
      this.cts.addCustomTexts(authData.customTexts);
    }
    localStorage.setItem(localStorageAuthDataKey, JSON.stringify(authData));
  }

  logOut(): void {
    this.cts.restoreDefault(true);
    this.bs.deleteSession()
      .subscribe(() => {
        this._authData$.next(null);
        localStorage.removeItem(localStorageAuthDataKey);
        this.router.navigate(['/']);
      });
  }

  resetAuthData(): void {
    const storageEntry = localStorage.getItem(localStorageAuthDataKey);
    if (storageEntry) {
      localStorage.removeItem(localStorageAuthDataKey);
    }
    this._authData$.next(this.getAuthData());
  }
}
