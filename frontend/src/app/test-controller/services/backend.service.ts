import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  UnitData, TestData, StateReportEntry, LoadingFile,
  KeyValuePairString, UnitStateUpdate, TestStateUpdate
} from '../interfaces/test-controller.interfaces';
import { MainDataService } from '../../shared/services/maindata/maindata.service';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('BACKEND_URL') public backendUrl: string,
    private http: HttpClient,
    private mds: MainDataService
  ) {
  }

  saveReview(
    testId: string,
    unitAlias: string | null,
    page: number | null,
    pagelabel: string | null,
    priority: number,
    categories: string,
    entry: string,
    userAgent: string,
    originalUnitId: string
  ): Observable<void> {
    return this.http.put<void>(
      `${this.backendUrl}test/${testId}${unitAlias ? `/unit/${unitAlias}` : ''}/review`,
      {
        priority, categories, entry, page, pagelabel, userAgent, originalUnitId
      }
    );
  }

  getTestData(testId: string): Observable<TestData> {
    return this.http.get<TestData>(`${this.backendUrl}test/${testId}`);
  }

  getUnitData(testId: string, unitid: string, unitalias: string): Observable<UnitData> {
    return this.http.get<UnitData>(`${this.backendUrl}test/${testId}/unit/${unitid}/alias/${unitalias}`);
  }

  patchTestState(patch: TestStateUpdate): Observable<string> {
    return this.http.patch<string>(`${this.backendUrl}test/${patch.testId}/state`, patch.state);
  }

  addTestLog(testId: string, logEntries: StateReportEntry<string>[]): Subscription {
    return this.http.put(`${this.backendUrl}test/${testId}/log`, logEntries).subscribe();
  }

  patchUnitState(stateUpdate: UnitStateUpdate, originalUnitId: string): Observable<void> {
    return this.http.patch<void>(
      `${this.backendUrl}test/${stateUpdate.testId}/unit/${stateUpdate.unitAlias}/state`,
      { newState: stateUpdate.state, originalUnitId }
    );
  }

  addUnitLog(testId: string, unitName: string, originalUnitId: string, logEntries: StateReportEntry<string>[]): Subscription {
    return this.http.put(`${this.backendUrl}test/${testId}/unit/${unitName}/log`, {
      logEntries,
      originalUnitId
    }).subscribe();
  }

  notifyDyingTest(testId: string): void {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${this.backendUrl}test/${testId}/connection-lost`);
    } else {
      fetch(`${this.backendUrl}test/${testId}/connection-lost`, {
        keepalive: true,
        method: 'POST'
      });
    }
  }

  updateDataParts(
    testId: string,
    unitAlias: string,
    originalUnitId: string,
    dataParts: KeyValuePairString,
    responseType: string
  ): Observable<void> {
    const timeStamp = Date.now();
    return this.http.put<void>(`${this.backendUrl}test/${testId}/unit/${unitAlias}/response`, {
      timeStamp, dataParts, originalUnitId, responseType
    });
  }

  lockTest(testId: string, timeStamp: number, message: string): Observable<boolean> {
    return this.http
      .patch<boolean>(`${this.backendUrl}test/${testId}/lock`, { timeStamp, message });
  }

  getResource(workspaceId: number, path: string): Observable<LoadingFile> {
    const resourceUri = this.mds.appConfig?.fileServiceUri ?? this.backendUrl;
    return this.http
      .get(
        `${resourceUri}file/${this.mds.getAuthData()?.groupToken}/ws_${workspaceId}/${path}`,
        {
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
                throw new Error(`Empty response for  '${path}'. Most likely the browsers memory was exhausted.`);
              }
              return { content: event.body };

            default:
              return null;
          }
        }),
        filter((progressOfContent): progressOfContent is LoadingFile => progressOfContent != null)
      );
  }
}
