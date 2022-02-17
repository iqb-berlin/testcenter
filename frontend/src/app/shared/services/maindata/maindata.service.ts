import { Inject, Injectable } from '@angular/core';
import {
  BehaviorSubject, Observable, ReplaySubject, Subject
} from 'rxjs';
import { CustomtextService } from '../customtext/customtext.service';
import {
  AppError,
  AuthData, KeyValuePairs
} from '../../../app.interfaces';
import { AppConfig } from '../../classes/app.config';
import { localStorageTestConfigKey } from '../../interfaces/app-config.interfaces';

const localStorageAuthDataKey = 'iqb-tc-a';

@Injectable({
  providedIn: 'root'
})
export class MainDataService {
  appError$ = new ReplaySubject<AppError>(1);
  private _authData$ = new Subject<AuthData>();
  get authData$(): Observable<AuthData> {
    return this._authData$.asObservable();
  }

  errorReportingSilent = false;
  isSpinnerOn$ = new BehaviorSubject<boolean>(false);
  progressVisualEnabled = true;
  appConfig: AppConfig = null;
  sysCheckAvailable = false;
  appTitle$ = new BehaviorSubject<string>('IQB-Testcenter');
  appSubTitle$ = new BehaviorSubject<string>('');
  globalWarning = '';

  postMessage$ = new Subject<MessageEvent>();
  appWindowHasFocus$ = new Subject<boolean>();

  // TODO refactor this, it's very inefficient
  // everytime authData is needed, getAuthData gets called and localstorage gets accessed.
  // better would be to access it once at loading time abd later use the valueOf _authData$

  static getAuthData(): AuthData {
    const storageEntry = localStorage.getItem(localStorageAuthDataKey);
    if (!storageEntry) {
      return null;
    }
    try {
      return JSON.parse(storageEntry as string);
    } catch (e) {
      console.warn('corrupt localStorage authData entry');
      return null;
    }
  }

  static getTestConfig(): KeyValuePairs {
    const storageEntry = localStorage.getItem(localStorageTestConfigKey);
    if (!storageEntry) {
      return null;
    }
    try {
      return JSON.parse(storageEntry as string);
    } catch (e) {
      console.warn('corrupt localStorage testConfig entry');
      return null;
    }
  }

  constructor(
    @Inject('API_VERSION_EXPECTED') readonly expectedApiVersion: string,
    private cts: CustomtextService
  ) {
  }

  setSpinnerOn(): void {
    this.isSpinnerOn$.next(true);
  }

  setSpinnerOff(): void {
    this.isSpinnerOn$.next(false);
  }

  setAuthData(authData: AuthData = null): void {
    this._authData$.next(authData);
    if (authData) {
      if (authData.customTexts) {
        this.cts.addCustomTexts(authData.customTexts);
      }
      localStorage.setItem(localStorageAuthDataKey, JSON.stringify(authData));
    } else {
      localStorage.removeItem(localStorageAuthDataKey);
    }
  }

  resetAuthData(): void {
    const storageEntry = localStorage.getItem(localStorageAuthDataKey);
    if (storageEntry) {
      localStorage.removeItem(localStorageAuthDataKey);
    }
    this._authData$.next(MainDataService.getAuthData());
  }

  setTestConfig(testConfig: KeyValuePairs = null): void {
    if (testConfig) {
      localStorage.setItem(localStorageTestConfigKey, JSON.stringify(testConfig));
    } else {
      localStorage.removeItem(localStorageTestConfigKey);
    }
    this._authData$.next(MainDataService.getAuthData());
  }
}
