import { HttpClient, HttpResponse } from '@angular/common/http';
import { Inject, Injectable, SkipSelf } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AttachmentData, AttachmentTargetLabel, GroupData } from '../../interfaces/users.interfaces';

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

  postAttachment(attachmentTargetCode: string, file: File): Observable<boolean> {
    const formData = new FormData();
    formData.append('mimeType', file.type);
    formData.append('attachment', file, file.name);
    formData.append('timeStamp', Date.now().toString());
    return this.http
      .post<boolean>(`${this.serverUrl}attachment/${attachmentTargetCode}`, formData, { observe: 'response' })
      .pipe(
        map((res: HttpResponse<unknown>) => (res.status === 201)),
        catchError(() => of(false))
      );
  }

  getAttachmentTargetLabel(attachmentTargetCode: string): Observable<AttachmentTargetLabel> {
    return this.http
      .get<AttachmentTargetLabel>(`${this.serverUrl}attachment/${attachmentTargetCode}/target-label`);
  }

  getAttachmentsData(groups: string[]): Observable<AttachmentData[]> {
    return this.http
      .get<AttachmentData[]>(`${this.serverUrl}attachments/data`, { params: { groups: groups.join(',') } });
  }

  getAttachment(attachmentId: string): Observable<Blob> {
    return this.http
      .get(`${this.serverUrl}attachment/${attachmentId}`, { responseType: 'blob' });
  }
}
