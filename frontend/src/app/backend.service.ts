/* eslint-disable no-console */
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SysCheckInfo, AuthData, ApiError } from './app.interfaces';
import { SysConfig } from './shared/shared.module';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient
  ) {}

  login(
    loginType: 'admin' | 'login',
    name: string,
    password: string | undefined = undefined
  ): Observable<AuthData | number> {
    return (loginType === 'admin') ?
      this.loginAsAdmin({ name, password }) :
      this.loginAsLogin({ name, password });
  }

  loginAsAdmin(credentials: { name: string, password: string }): Observable<AuthData | number> {
    return this.http
      .put<AuthData>(`${this.serverUrl}session/admin`, credentials)
      .pipe(catchError((err: ApiError) => of(err.code)));
  }

  loginAsLogin(credentials: { name: string, password?: string }): Observable<AuthData | number> {
    return this.http
      .put<AuthData>(`${this.serverUrl}session/login`, credentials)
      .pipe(catchError((err: ApiError) => of(err.code)));
  }

  codeLogin(code: string): Observable<AuthData | number> {
    return this.http
      .put<AuthData>(`${this.serverUrl}session/person`, { code })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`codeLogin Api-Error: ${err.code} ${err.info} `);
          return of(err.code);
        })
      );
  }

  getSessionData(): Observable<AuthData | number> {
    return this.http
      .get<AuthData>(`${this.serverUrl}session`)
      .pipe(
        catchError((err: ApiError) => of(err.code))
      );
  }

  startTest(bookletName: string): Observable<string | number> {
    return this.http
      .put<number>(`${this.serverUrl}test`, { bookletName })
      .pipe(
        map((testId: number) => String(testId)),
        catchError((err: ApiError) => of(err.code))
      );
  }

  getSysConfig(): Observable<SysConfig | null> {
    return this.http
      .get<SysConfig>(`${this.serverUrl}system/config`)
      .pipe(
        catchError(() => of(null))
      );
  }

  getSysCheckInfo(): Observable<SysCheckInfo[]> {
    return this.http
      .get<SysCheckInfo[]>(`${this.serverUrl}sys-checks`)
      .pipe(
        catchError(() => of([]))
      );
  }
}
