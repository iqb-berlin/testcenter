import { Observable, of, timeoutWith } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient
  ) {
  }

  deleteSession(): Observable<void> {
    return this.http
      .delete<void>(`${this.serverUrl}session`)
      .pipe(
        timeoutWith<void, void>(1000, of(<void>null)),
        catchError(() => of(<void>null))
      );
  }

  clearCache(): Observable<void> {
    return this.http.post<void>(`${this.serverUrl}clear-cache`, {});
  }
}
