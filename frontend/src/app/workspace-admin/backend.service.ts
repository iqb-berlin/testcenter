/* eslint-disable no-console */
import { Injectable, Inject, SkipSelf } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';

import {
  GetFileResponseData,
  SysCheckStatistics,
  ResultData,
  ReportType
} from './workspace.interfaces';
import {
  FileDeletionReport, UploadReport, UploadResponse, UploadStatus
} from './files/files.interfaces';
import { AppError } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    @SkipSelf() private http: HttpClient
  ) {
  }

  // TODO! can be removed?
  // getWorkspace(workspaceId: string): Observable<WorkspaceData> {
  //   return this.http.get<WorkspaceData>(`${this.serverUrl}workspace/${workspaceId}`);
  // }

  getFiles(workspaceId: string): Observable<GetFileResponseData> {
    return this.http.get<GetFileResponseData>(`${this.serverUrl}workspace/${workspaceId}/files`);
  }

  deleteFiles(workspaceId: string, filesToDelete: Array<string>): Observable<FileDeletionReport> {
    return this.http.request<FileDeletionReport>(
      'delete',
      `${this.serverUrl}workspace/${workspaceId}/files`,
      { body: { f: filesToDelete } }
    );
  }

  getResults(workspaceId: string): Observable<ResultData[]> {
    return this.http.get<ResultData[]>(`${this.serverUrl}workspace/${workspaceId}/results`, {});
  }

  deleteResponses(workspaceId: string, groups: string[]): Observable<void> {
    return this.http
      .request<void>('delete', `${this.serverUrl}workspace/${workspaceId}/responses`, { body: { groups } });
  }

  getSysCheckReportsOverview(workspaceId: string): Observable<SysCheckStatistics[]> {
    return this.http.get<SysCheckStatistics[]>(`${this.serverUrl}workspace/${workspaceId}/sys-check/reports/overview`);
  }

  deleteSysCheckReports(workspaceId: string, checkIds: string[]): Observable<FileDeletionReport> {
    return this.http.request<FileDeletionReport>(
      'delete',
      `${this.serverUrl}workspace/${workspaceId}/sys-check/reports`,
      { body: { checkIds } }
    );
  }

  getReport(workspaceId: string, reportType: ReportType, dataIds: string[]) : Observable<Blob> {
    return this.http
      .get(
        `${this.serverUrl}workspace/${workspaceId}/report/${reportType}`,
        {
          params: {
            dataIds: dataIds.join(',')
          },
          headers: {
            Accept: 'text/csv'
          },
          responseType: 'blob'
        }
      );
  }

  getFile(workspaceId: string, fileType: string, fileName: string): Observable<Blob> {
    return this.http
      .get(`${this.serverUrl}workspace/${workspaceId}/file/${fileType}/${fileName}`, { responseType: 'blob' });
  }

  postFile(workspaceId: string, formData: FormData): Observable<UploadResponse> {
    return this.http.post<UploadReport>(
      `${this.serverUrl}workspace/${workspaceId}/file`,
      formData,
      {
        // TODO de-comment, if backend UploadedFilesHandler.class.php l. 47 was fixed
        // headers: new HttpHeaders().set('Content-Type', 'multipart/form-data'),
        observe: 'events',
        reportProgress: true,
        responseType: 'json'
      }
    )
      .pipe(
        catchError((err: AppError) => of({
          progress: 0,
          status: UploadStatus.error,
          report: { Upload: { error: [err.description] } }
        })),
        map((event: HttpEvent<UploadReport> | UploadResponse) => {
          if ('progress' in event) {
            return event;
          }
          if (event.type === HttpEventType.UploadProgress) {
            return {
              progress: Math.floor((event.loaded * 100) / event.total),
              status: UploadStatus.busy,
              report: {}
            };
          }
          if (event.type === HttpEventType.Response) {
            return {
              progress: 100,
              status: UploadStatus.ok,
              report: event.body
            };
          }
          return null;
        }),
        filter((response: UploadResponse | null) => !!response)
      );
  }
}
