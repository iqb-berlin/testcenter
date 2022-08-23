import { HttpClient, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AttachmentTarget, GroupData } from '../../interfaces/users.interfaces';

@Injectable()
export class BackendService {
  constructor(
    @Inject('SERVER_URL') protected serverUrl: string,
    private http: HttpClient
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

  addAttachment(target: AttachmentTarget, file: File): Observable<boolean> {
    console.log('addAttachment', target);
    const formData = new FormData();
    formData.append('mimeType', file.type);
    formData.append('attachment', file, file.name);
    formData.append('timeStamp', Date.now().toString());
    return this.http
      .put(
        `${this.serverUrl}test/${target.testId}/attachment}`,
        formData,
        { observe: 'response' }
      )
      .pipe(
        map((res: HttpResponse<unknown>) => (res.status === 201)),
        catchError(() => of(false))
      );
  }

  getAttachmentTarget(codeContent: string): Observable<AttachmentTarget> {
    console.log('getAttachmentTarget', codeContent);
    // TODO implement
    return of({
      label: 'Booklet XYZ of user abc',
      testId: '',
      unitId: ''
    });
  }
}
