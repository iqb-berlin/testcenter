/* eslint-disable no-console */
import { Injectable, Inject, SkipSelf } from '@angular/core';
import {
  HttpClient, HttpErrorResponse, HttpEvent, HttpEventType
} from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';

import {
  GetFileResponseData,
  SysCheckStatistics,
  ReviewData,
  LogData,
  UnitResponse,
  ResultData,
  ReportType
} from './workspace.interfaces';
import {
  FileDeletionReport, UploadReport, UploadResponse, UploadStatus
} from './files/files.interfaces';
import { ApiError, WorkspaceData } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    @SkipSelf() private http: HttpClient
  ) {
  }

  getWorkspaceData(workspaceId: string): Observable<WorkspaceData | number> {
    return this.http
      .get<WorkspaceData>(`${this.serverUrl}workspace/${workspaceId}`)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getWorkspaceData Api-Error: ${err.code} ${err.info} `);
          return of(err.code);
        })
      );
  }

  getFiles(workspaceId: string): Observable<GetFileResponseData> {
    return this.http
      .get<GetFileResponseData>(`${this.serverUrl}workspace/${workspaceId}/files`)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getFiles Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  deleteFiles(workspaceId: string, filesToDelete: Array<string>): Observable<FileDeletionReport> {
    const endpointUrl = `${this.serverUrl}workspace/${workspaceId}/files`;
    return this.http
      .request<FileDeletionReport>('delete', endpointUrl, { body: { f: filesToDelete } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`deleteFiles Api-Error: ${err.code} ${err.info} `);
          return of(<FileDeletionReport> {
            deleted: [],
            not_allowed: [`deleteFiles Api-Error: ${err.code} ${err.info} `],
            did_not_exist: []
          });
        })
      );
  }

  getResultData(workspaceId: string): Observable<ResultData[]> {
    return this.http
      .get<ResultData[]>(`${this.serverUrl}workspace/${workspaceId}/results`, {})
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getResultData Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  getResponses(workspaceId: string, groups: string[]): Observable<UnitResponse[]> {
    return this.http
      .get<UnitResponse[]>(
      `${this.serverUrl}workspace/${workspaceId}/responses`,
      { params: { groups: groups.join(',') } }
    )
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getResponses Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  getLogs(workspaceId: string, groups: string[]): Observable<LogData[]> {
    return this.http
      .get<LogData[]>(`${this.serverUrl}workspace/${workspaceId}/logs`, { params: { groups: groups.join(',') } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getLogs Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  getReviews(workspaceId: string, groups: string[]): Observable<ReviewData[]> {
    return this.http
      .get<ReviewData[]>(`${this.serverUrl}workspace/${workspaceId}/reviews`, { params: { groups: groups.join(',') } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getReviews Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  deleteData(workspaceId: string, groups: string[]): Observable<boolean> {
    return this.http
      .request('delete', `${this.serverUrl}workspace/${workspaceId}/responses`, { body: { groups } })
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`deleteData Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  getSysCheckReportList(workspaceId: string): Observable<SysCheckStatistics[]> {
    return this.http
      .get<ReviewData[]>(`${this.serverUrl}workspace/${workspaceId}/sys-check/reports/overview`)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getSysCheckReportList Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  getSysCheckReport(workspaceId: string, reports: string[], enclosure: string, delimiter: string, lineEnding: string)
    : Observable<Blob | boolean> {
    return this.http
      .get(`${this.serverUrl}workspace/${workspaceId}/sys-check/reports`,
        {
          params: {
            checkIds: reports.join(','),
            delimiter,
            enclosure,
            lineEnding
          },
          headers: {
            Accept: 'text/csv'
          },
          responseType: 'blob'
        })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getSysCheckReport Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  deleteSysCheckReports(workspaceId: string, checkIds: string[]): Observable <FileDeletionReport> {
    return this.http
      .request<FileDeletionReport>(
      'delete',
      `${this.serverUrl}workspace/${workspaceId}/sys-check/reports`,
      { body: { checkIds } }
    )
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`deleteSysCheckReports Api-Error: ${err.code} ${err.info} `);
          return of(<FileDeletionReport> {
            deleted: [],
            not_allowed: [`deleteSysCheckReports Api-Error: ${err.code} ${err.info} `],
            did_not_exist: []
          });
        })
      );
  }

  getReport(workspaceId: string, reportType: ReportType, dataIds: string[]) : Observable<Blob | boolean> {
    return this.http
      .get(`${this.serverUrl}workspace/${workspaceId}/report/${reportType}`,
        {
          params: {
            dataIds: dataIds.join(',')
          },
          headers: {
            Accept: 'text/csv'
          },
          responseType: 'blob'
        })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getReports Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  downloadFile(workspaceId: string, fileType: string, fileName: string): Observable<Blob | boolean> {
    return this.http
      .get(`${this.serverUrl}workspace/${workspaceId}/file/${fileType}/${fileName}`, { responseType: 'blob' })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`downloadFile Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  uploadFile(workspaceId: string, formData: FormData): Observable<UploadResponse> {
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
        catchError((err: ApiError) => {
          console.warn(`downloadFile Api-Error: ${err.code} ${err.info} `);
          let errorText = 'Hochladen nicht erfolgreich.';
          if (err instanceof HttpErrorResponse) {
            errorText = (err as HttpErrorResponse).message;
          } else if (err instanceof ApiError) {
            const slashPos = err.info.indexOf(' // ');
            errorText = (slashPos > 0) ? err.info.substr(slashPos + 4) : err.info;
          }
          return of({
            progress: 0,
            status: UploadStatus.error,
            report: { '': { error: [errorText] } }
          });
        }),
        map((event: HttpEvent<UploadReport>) => {
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
