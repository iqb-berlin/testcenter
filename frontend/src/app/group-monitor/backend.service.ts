import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  BookletError, CommandResponse, Profile, TestSessionData
} from './group-monitor.interfaces';
import { WebsocketBackendService } from '../shared/shared.module';
import { AppError } from '../app.interfaces';

@Injectable()
export class BackendService extends WebsocketBackendService<TestSessionData[]> {
  pollingEndpoint = 'monitor/test-sessions';
  pollingInterval = 5000;
  wsChannelName = 'test-sessions';
  initialData: TestSessionData[] = [];

  observeSessionsMonitor(groupName: string): Observable<TestSessionData[]> {
    this.pollingEndpoint = `monitor/group/${groupName}/test-sessions`;
    return this.observeEndpointAndChannel();
  }

  getBooklet(bookletName: string): Observable<string | BookletError> {
    const headers = new HttpHeaders({ 'Content-Type': 'text/xml' }).set('Accept', 'text/xml');
    const missingFileError: BookletError = { error: 'missing-file', species: null };
    const generalError: BookletError = { error: 'general', species: null };

    return this.http
      .get(`${this.serverUrl}booklet/${bookletName}`, { headers, responseType: 'text' })
      .pipe(
        catchError((err: AppError) => {
          // we don't rely on general error handler here, because this is to interwoven with subsequent requests
          if (err.code === 404) {
            // could potentially happen when booklet file was removed since test was started
            return of(missingFileError);
          }
          return of(generalError);
        })
      );
  }

  command(keyword: string, args: string[], testIds: number[]): Observable<CommandResponse> {
    return this.http
      .put(
        `${this.serverUrl}monitor/command`,
        {
          keyword,
          arguments: args,
          timestamp: Date.now() / 1000,
          testIds
        }
      )
      .pipe(
        map(() => ({ commandType: keyword, testIds }))
      );
  }

  unlock(groupName: string, testIds: number[]): Observable<CommandResponse> {
    return this.http
      .post(`${this.serverUrl}monitor/group/${groupName}/tests/unlock`, { testIds })
      .pipe(
        map(() => ({ commandType: 'unlock', testIds }))
      );
  }

  lock(groupName: string, testIds: number[]): Observable<CommandResponse> {
    return this.http
      .post(`${this.serverUrl}monitor/group/${groupName}/tests/lock`, { testIds })
      .pipe(
        map(() => ({ commandType: 'unlock', testIds }))
      );
  }

  getProfile(profileId: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.serverUrl}monitor/profile/${profileId}`);
  }
}
