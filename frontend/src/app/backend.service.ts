/* eslint-disable no-console */
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  SysCheckInfo,
  AuthData,
  WorkspaceData,
  BookletData, ApiError, AccessObject
} from './app.interfaces';
import { SysConfig } from './shared/shared.module';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient
  ) {}

  login(type: 'admin' | 'login', name: string, password: string = undefined): Observable<AuthData | number> {
    return (type === 'admin') ? this.loginAsAdmin({ name, password }) : this.loginAsLogin({ name, password });
  }

  loginAsAdmin(credentials: { name: string, password: string }): Observable<AuthData | number> {
    return this.http
      .put<AuthData>(`${this.serverUrl}session/admin`, credentials)
      .pipe(catchError((err: ApiError) => of(err.code)));
  }

  loginAsLogin(credentials: { name: string, password?: string }): Observable<AuthData | number> {
    return this.http
      .put<AuthData>(`${this.serverUrl}session/login`, credentials)
      .pipe(catchError((err: ApiError) => of(err.code)));
  }

  codeLogin(code: string): Observable<AuthData | number> {
    return this.http
      .put<AuthData>(`${this.serverUrl}session/person`, { code })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`codeLogin Api-Error: ${err.code} ${err.info} `);
          return of(err.code);
        })
      );
  }

  getWorkspaceData(workspaceId: string): Observable<WorkspaceData> {
    return this.http
      .get<WorkspaceData>(`${this.serverUrl}workspace/${workspaceId}`)
      .pipe(catchError(() => {
        console.warn(`get workspace data failed for ${workspaceId}`);
        return of(<WorkspaceData>{
          id: workspaceId,
          name: workspaceId,
          role: 'n.d.'
        });
      }));
  }

  getGroupData(groupName: string): Observable<AccessObject> {
    // TODO find consistent terminology. in XSD they are called name & label
    // and likewise (mostly) in newer BE-versions
    interface NameAndLabel {
      name: string;
      label: string;
    }

    return this.http
      .get<NameAndLabel>(`${this.serverUrl}monitor/group/${groupName}`)
      .pipe(map((r: NameAndLabel): AccessObject => ({ id: r.name, name: r.label })))
      .pipe(catchError(() => {
        console.warn(`get group data failed for ${groupName}`);
        return of(<AccessObject>{
          id: groupName,
          name: groupName
        });
      }));
  }

  getSessionData(): Observable<AuthData | number> {
    return this.http
      .get<AuthData>(`${this.serverUrl}session`)
      .pipe(
        catchError((err: ApiError) => of(err.code))
      );
  }

  getBookletData(bookletId: string): Observable<BookletData> {
    return this.http
      .get<BookletData>(`${this.serverUrl}booklet/${bookletId}/data`)
      .pipe(
        map(bData => {
          bData.id = bookletId;
          return bData;
        }),
        catchError(() => of(<BookletData>{
          id: bookletId,
          label: bookletId,
          locked: true,
          running: false
        }))
      );
  }

  startTest(bookletName: string): Observable<string | number> {
    return this.http
      .put<number>(`${this.serverUrl}test`, { bookletName })
      .pipe(
        map((testId: number) => String(testId)),
        catchError((err: ApiError) => of(err.code))
      );
  }

  getSysConfig(): Observable<SysConfig> {
    return this.http
      .get<SysConfig>(`${this.serverUrl}system/config`)
      .pipe(catchError(() => of(null)));
  }

  getSysCheckInfo(): Observable<SysCheckInfo[]> {
    return this.http
      .get<SysCheckInfo[]>(`${this.serverUrl}sys-checks`)
      .pipe(
        catchError(() => of([]))
      );
  }
}
