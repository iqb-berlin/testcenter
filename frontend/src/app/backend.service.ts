import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SysCheckInfo, AuthData, AppError } from './app.interfaces';
import { SysConfig } from './shared/shared.module';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('BACKEND_URL') private readonly serverUrl: string,
    private http: HttpClient
  ) {}

  adminLogin(name: string, password: string | undefined = undefined): Observable<AuthData> {
    return this.http.put<AuthData>(`${this.serverUrl}session/admin`, { name, password });
  }

  login(loginType: 'admin' | 'login', name: string, password: string | undefined = undefined): Observable<AuthData> {
    return this.http.put<AuthData>(`${this.serverUrl}session/${loginType}`, { name, password });
  }

  codeLogin(code: string): Observable<AuthData> {
    return this.http.put<AuthData>(`${this.serverUrl}session/person`, { code });
  }

  getSessionData(): Observable<AuthData> {
    return this.http.get<AuthData>(`${this.serverUrl}session`);
  }

  startTest(bookletName: string): Observable<number> {
    return this.http
      .put<number>(`${this.serverUrl}test`, { bookletName });
  }

  getSysConfig(): Observable<SysConfig> {
    return this.http
      .get<SysConfig>(`${this.serverUrl}system/config`)
      .pipe(
        catchError((error: AppError) => {
          if (error.code !== 503) {
            error.type = 'fatal';
          }
          throw error;
        })
      );
  }

  checkIfSysCheckModeExists(): Observable<boolean> {
    return this.http
      .get<boolean>(`${this.serverUrl}sys-check-mode`);
  }

  getSysCheckInfosAcrossWorkspaces(): Observable<SysCheckInfo[]> {
    return this.http
      .get<SysCheckInfo[]>(`${this.serverUrl}sys-checks`);
  }

  downloadReviews(): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.serverUrl}reviews/export`, {
      headers: {
        Accept: 'text/csv'
      },
      responseType: 'blob',
      observe: 'response'
    });
  }
}
