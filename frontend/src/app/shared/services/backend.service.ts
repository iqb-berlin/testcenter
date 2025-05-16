import { Observable, of, timeoutWith } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SysStatus } from '../interfaces/service-status.interfaces';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('BACKEND_URL') private readonly serverUrl: string,
    private http: HttpClient
  ) {
  }

  changePassword(userId: number, password: string): Observable<boolean> {
    return this.http.patch<boolean>(`${this.serverUrl}user/${userId}/password`, { p: password });
  }

  deleteSession(): Observable<void> {
    return this.http
      .delete<void>(`${this.serverUrl}session`)
      .pipe(
        timeoutWith<void, void>(1000, of<void>()),
        catchError(() => of<void>())
      );
  }

  clearCache(...directives: string[]): Observable<void> {
    const payload = directives.length ? { directives } : {};
    return this.http.post<void>(`${this.serverUrl}clear-cache`, payload);
  }

  getSysStatus(): Observable<SysStatus> {
    return this.http.get<SysStatus>(`${this.serverUrl}system/status`);
  }
}
