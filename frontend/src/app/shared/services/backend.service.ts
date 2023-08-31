import { Observable, of, timeoutWith } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SysStatus } from '../interfaces/app-config.interfaces';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('BACKEND_URL') private readonly serverUrl: string,
    private http: HttpClient
  ) {
  }

  deleteSession(): Observable<void> {
    return this.http
      .delete<void>(`${this.serverUrl}session`)
      .pipe(
        timeoutWith<void, void>(1000, of<void>()),
        catchError(() => of<void>())
      );
  }

  clearCache(): Observable<void> {
    return this.http.post<void>(`${this.serverUrl}clear-cache`, {});
  }

  getSysStatus(): Observable<SysStatus> {
    return this.http.get<SysStatus>(`${this.serverUrl}system/status`);
  }
}
