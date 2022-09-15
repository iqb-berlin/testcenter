import { HttpClient, HttpResponse } from '@angular/common/http';
import { Inject, Injectable, SkipSelf } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AttachmentData, GroupData } from '../../interfaces/users.interfaces';

@Injectable()
export class BackendService {
  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    @SkipSelf() private http: HttpClient
  ) {
  }

  getGroupData(groupName: string): Observable<GroupData> {
    // TODO error-handling: interceptor should have interfered and moved to error-page ...
    // https://github.com/iqb-berlin/testcenter-frontend/issues/53
    return this.http
      .get<GroupData>(`${this.serverUrl}monitor/group/${groupName}`)
      .pipe(catchError(() => of(<GroupData>{
        name: 'error',
        label: 'error'
      })));
  }

  postAttachment(attachmentId: string, file: File): Observable<boolean> {
    const formData = new FormData();
    formData.append('mimeType', file.type);
    formData.append('attachment', file, file.name);
    return this.http
      .post<boolean>(`${this.serverUrl}attachment/${attachmentId}/file`, formData, { observe: 'response' })
      .pipe(
        map((res: HttpResponse<unknown>) => (res.status === 201)),
        catchError(() => of(false))
      );
  }

  getAttachmentData(attachmentId: string): Observable<AttachmentData> {
    return this.http
      .get<AttachmentData>(`${this.serverUrl}attachment/${attachmentId}/data`);
  }

  getAttachmentsList(groups: string[]): Observable<AttachmentData[]> {
    return this.http
      .get<AttachmentData[]>(`${this.serverUrl}attachments/list`, { params: { groups: groups.join(',') } });
  }

  getAttachmentFile(attachmentId: string, attachmentFileId: string): Observable<Blob> {
    return this.http
      .get(`${this.serverUrl}attachment/${attachmentId}/file/${attachmentFileId}`, { responseType: 'blob' });
  }

  deleteAttachmentFile(attachmentId: string, attachmentFileId: string): Observable<boolean> {
    return this.http
      .delete<boolean>(`${this.serverUrl}attachment/${attachmentId}/file/${attachmentFileId}`)
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  // TODO error handling
  getAttachmentPage(attachmentId: string): Observable<Blob> {
    return this.http.get(
      `${this.serverUrl}attachment/${attachmentId}/page`,
      {
        observe: 'response',
        responseType: 'blob'
      }
    )
      .pipe(
        map((response: HttpResponse<Blob>) => new Blob([response.body], { type: response.headers['Content-Type'] }))
      );
  }

  // TODO error handling
  getAttachmentPages(): Observable<Blob> {
    return this.http.get(
      `${this.serverUrl}attachments/pages`,
      {
        observe: 'response',
        responseType: 'blob'
      }
    )
      .pipe(
        map((response: HttpResponse<Blob>) => new Blob([response.body], { type: response.headers['Content-Type'] }))
      );
  }
}
