import { Injectable } from '@angular/core';
import {
  BehaviorSubject, Observable, ReplaySubject, Subject
} from 'rxjs';
import { Router } from '@angular/router';
import { distinct } from 'rxjs/internal/operators/distinct';
import { shareReplay } from 'rxjs/internal/operators/shareReplay';
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
  private _appError$ = new ReplaySubject<AppError>(1);
  get appError$(): Observable<AppError> {
    return this._appError$
      .pipe(
        distinct(error => (error.stack ?? '') + (error.errorId ?? '')),
        shareReplay(0)
      );
  }

  set appError(error: AppError) {
    this._appError$.next(error);
  }

  private _authData$ = new BehaviorSubject<AuthData | null>(null);
  get authData$(): Observable<AuthData | null> {
    return this._authData$.asObservable();
  }

  appConfig: AppConfig | null = null;
  sysCheckAvailable = false;
  appTitle$ = new BehaviorSubject<string>('IQB-Testcenter');
  appSubTitle$ = new BehaviorSubject<string>('');
  globalWarning = '';

  postMessage$ = new Subject<MessageEvent>();
  appWindowHasFocus$ = new Subject<boolean>();

  getAuthData(): AuthData | null {
    if (this._authData$.getValue()) {
      return this._authData$.getValue();
    }
    try {
      const entry = localStorage.getItem(localStorageAuthDataKey);
      if (!entry) {
        return null;
      }
      return JSON.parse(entry);
    } catch (e) {
      return null;
    }
  }

  getAccessObject(type: AuthAccessType, id: string): AccessObject {
    const authData = this.getAuthData();
    if (!authData) {
      throw new AppError({ type: 'session', description: '', label: 'Nicht angemeldet' });
    }
    const claim = authData.claims[type].find(accessObject => accessObject.id === id);
    if (!claim) {
      throw new AppError({ type: 'session', description: '', label: `${type} ${id} nicht freigegeben.` });
    }
    return claim;
  }

  constructor(
    private cts: CustomtextService,
    private bs: BackendService,
    private router: Router
  ) {
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
        this.quit();
      });
  }

  quit(): void {
    this._authData$.next(null);
    localStorage.removeItem(localStorageAuthDataKey);
    this.router.navigate(['/']);
  }

  resetAuthData(): void {
    const storageEntry = localStorage.getItem(localStorageAuthDataKey);
    if (storageEntry) {
      localStorage.removeItem(localStorageAuthDataKey);
    }
    this._authData$.next(this.getAuthData());
  }

  reloadPage(logOut: boolean = false): void {
    if (logOut) {
      this._authData$.next(null);
      localStorage.removeItem(localStorageAuthDataKey);
    }
    this.bs.clearCache();
    setTimeout(() => { window.location.href = '/'; }, 100);
  }
}
