/* eslint-disable no-console */
import { Injectable, Inject } from '@angular/core';
import {
  HttpClient, HttpEvent, HttpEventType, HttpParams
} from '@angular/common/http';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import {
  UnitData, TestData, StateReportEntry, LoadingFile, KeyValuePairString
} from '../interfaces/test-controller.interfaces';
import { ApiError } from '../../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('SERVER_URL') public serverUrl: string,
    private http: HttpClient
  ) {
  }

  saveUnitReview(testId: string, unitName: string, priority: number, categories: string, entry: string)
    : Observable<boolean> {
    return this.http
      .put(`${this.serverUrl}test/${testId}/unit/${unitName}/review`, { priority, categories, entry })
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`saveUnitReview Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  saveTestReview(testId: string, priority: number, categories: string, entry: string): Observable<boolean> {
    return this.http
      .put(`${this.serverUrl}test/${testId}/review`, { priority, categories, entry })
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`saveTestReview Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  getTestData(testId: string): Observable<TestData> {
    return this.http
      .get<TestData>(`${this.serverUrl}test/${testId}`);
  }

  getUnitData(testId: string, unitid: string, unitalias: string): Observable<UnitData | boolean> {
    return this.http
      .get<UnitData>(`${this.serverUrl}test/${testId}/unit/${unitid}/alias/${unitalias}`)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getUnitData Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  getResource(testId: string, resId: string, versionning = false): Observable<LoadingFile> {
    return this.http
      .get(
        `${this.serverUrl}test/${testId}/resource/${resId}`,
        {
          params: new HttpParams().set('v', versionning ? '1' : 'f'),
          responseType: 'text',
          reportProgress: true,
          observe: 'events'
        }
      )
      .pipe(
        map((event: HttpEvent<any>) => {
          switch (event.type) {
            case HttpEventType.ResponseHeader:
              return { progress: 0 };

            case HttpEventType.DownloadProgress:
              if (!event.total) { // happens if file is huge because browser switches to chunked loading
                return <LoadingFile>{ progress: 'UNKNOWN' };
              }
              return { progress: Math.round(100 * (event.loaded / event.total)) };

            case HttpEventType.Response:
              if (!event.body.length) {
                // this might happen when file is so large, that memory size get exhausted
                throw new Error(`Empty response for  '${resId}'. Most likely the browsers memory was exhausted.`);
              }
              return { content: event.body };

            default:
              return null;
          }
        }),
        filter(progressOfContent => progressOfContent != null)
      );
  }

  updateTestState(testId: string, newState: StateReportEntry[]): Subscription {
    return this.http
      .patch(`${this.serverUrl}test/${testId}/state`, newState)
      .subscribe({ error: (err: ApiError) => console.error(`updateTestState Api-Error: ${err.code} ${err.info}`) });
  }

  addTestLog(testId: string, logEntries: StateReportEntry[]): Subscription {
    return this.http
      .put(`${this.serverUrl}test/${testId}/log`, logEntries)
      .subscribe({ error: (err: ApiError) => console.error(`addTestLog Api-Error: ${err.code} ${err.info}`) });
  }

  updateUnitState(testId: string, unitName: string, newState: StateReportEntry[]): Subscription {
    return this.http
      .patch(`${this.serverUrl}test/${testId}/unit/${unitName}/state`, newState)
      .subscribe({ error: (err: ApiError) => console.error(`setUnitState Api-Error: ${err.code} ${err.info}`) });
  }

  addUnitLog(testId: string, unitName: string, logEntries: StateReportEntry[]): Subscription {
    return this.http
      .put(`${this.serverUrl}test/${testId}/unit/${unitName}/log`, logEntries)
      .subscribe({ error: (err: ApiError) => console.error(`addUnitLog Api-Error: ${err.code} ${err.info}`) });
  }

  notifyDyingTest(testId: string): void {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${this.serverUrl}test/${testId}/connection-lost`);
    } else {
      fetch(`${this.serverUrl}test/${testId}/connection-lost`, {
        keepalive: true,
        method: 'POST'
      });
    }
  }

  updateDataParts(testId: string, unitId: string,
                  dataParts: KeyValuePairString, responseType: string): Observable<boolean> {
    const timeStamp = Date.now();
    return this.http
      .put(`${this.serverUrl}test/${testId}/unit/${unitId}/response`, { timeStamp, dataParts, responseType })
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`Error storing unitResponse - Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  lockTest(testId: string, timeStamp: number, message: string): Observable<boolean> {
    return this.http
      .patch<boolean>(`${this.serverUrl}test/${testId}/lock`, { timeStamp, message })
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`lockBooklet Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }
}
