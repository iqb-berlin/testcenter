import { Inject, Injectable, SkipSelf } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResultData } from '../interfaces/study-monitor.interfaces';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('BACKEND_URL') private readonly serverUrl: string,
    @SkipSelf() private http: HttpClient
  ) {
  }

  getResults(workspaceId: number): Observable<ResultData[]> {
    return this.http.get<ResultData[]>(`${this.serverUrl}workspace/${workspaceId}/studyresults`, {});
  }
}
