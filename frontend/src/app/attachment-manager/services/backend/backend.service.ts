import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GroupData } from '../../interfaces/users.interfaces';

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
}
