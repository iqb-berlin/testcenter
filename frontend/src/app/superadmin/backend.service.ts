/* eslint-disable no-console */
import { Injectable, Inject, SkipSelf } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  IdAndName, IdLabelSelectedData, IdRoleData, UserData
} from './superadmin.interfaces';
import { ApiError, KeyValuePairs } from '../app.interfaces';
import { AppSettings } from '../shared/shared.module';

@Injectable({
  providedIn: 'root'
})

export class BackendService {
  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    @SkipSelf() private http: HttpClient
  ) {
  }

  getUsers(): Observable<UserData[]> {
    return this.http
      .get<UserData[]>(`${this.serverUrl}users`)
      .pipe(catchError((err: ApiError) => {
        console.warn(`getUsers Api-Error: ${err.code} ${err.info} `);
        return [];
      }));
  }

  addUser(name: string, password: string): Observable<boolean> {
    return this.http
      .put<boolean>(`${this.serverUrl}user`, { n: name, p: password });
  }

  changePassword(userId: number, password: string): Observable<boolean> {
    return this.http
      .patch<boolean>(`${this.serverUrl}user/${userId}/password`, { p: password });
  }

  setSuperUserStatus(userId: number, changeToSuperUser: boolean, password: string): Observable<number> {
    return this.http
      .patch(`${this.serverUrl}user/${userId}/super-admin/${changeToSuperUser ? 'on' : 'off'}`, { p: password })
      .pipe(
        map(() => 0),
        catchError((err: ApiError) => {
          console.warn(`setSuperUserStatus Api-Error: ${err.code} ${err.info} `);
          return of(err.code);
        })
      );
  }

  deleteUsers(users: string[]): Observable<boolean> {
    return this.http
      .request<boolean>('delete', `${this.serverUrl}users`, { body: { u: users } })
      .pipe(catchError((err: ApiError) => {
        console.warn(`deleteUsers Api-Error: ${err.code} ${err.info} `);
        return of(false);
      }));
  }

  getWorkspacesByUser(userId: number): Observable<IdRoleData[]> {
    return this.http
      .get<IdLabelSelectedData[]>(`${this.serverUrl}user/${userId}/workspaces`)
      .pipe(catchError((err: ApiError) => {
        console.warn(`getWorkspacesByUser Api-Error: ${err.code} ${err.info} `);
        return [];
      }));
  }

  setWorkspacesByUser(userId: number, accessTo: IdRoleData[]): Observable<boolean> {
    return this.http
      .patch<boolean>(`${this.serverUrl}user/${userId}/workspaces`, { ws: accessTo })
      .pipe(catchError((err: ApiError) => {
        console.warn(`setWorkspacesByUser Api-Error: ${err.code} ${err.info}`);
        return of(false);
      }));
  }

  addWorkspace(name: string): Observable<boolean> {
    return this.http
      .put<boolean>(`${this.serverUrl}workspace`, { name })
      .pipe(catchError((err: ApiError) => {
        console.warn(`addWorkspace Api-Error: ${err.code} ${err.info} `);
        return of(false);
      }));
  }

  renameWorkspace(workspaceId: number, wsName: string): Observable<boolean> {
    return this.http
      .patch<boolean>(`${this.serverUrl}workspace/${workspaceId}`, { name: wsName })
      .pipe(catchError((err: ApiError) => {
        console.warn(`renameWorkspace Api-Error: ${err.code} ${err.info} `);
        return of(false);
      }));
  }

  deleteWorkspaces(workspaces: number[]): Observable<boolean> {
    return this.http
      .request<boolean>('delete', `${this.serverUrl}workspaces`, { body: { ws: workspaces } })
      .pipe(catchError((err: ApiError) => {
        console.warn(`deleteWorkspaces Api-Error: ${err.code} ${err.info} `);
        return of(false);
      }));
  }

  getUsersByWorkspace(workspaceId: number): Observable<IdRoleData[]> {
    return this.http
      .get<IdRoleData[]>(`${this.serverUrl}workspace/${workspaceId}/users`)
      .pipe(catchError((err: ApiError) => {
        console.warn(`getUsersByWorkspace Api-Error: ${err.code} ${err.info} `);
        return [];
      }));
  }

  setUsersByWorkspace(workspaceId: number, accessing: IdRoleData[]): Observable<boolean> {
    return this.http
      .patch<boolean>(`${this.serverUrl}workspace/${workspaceId}/users`, { u: accessing })
      .pipe(catchError((err: ApiError) => {
        console.warn(`setUsersByWorkspace Api-Error: ${err.code} ${err.info}`);
        return of(false);
      }));
  }

  getWorkspaces(): Observable<IdAndName[]> {
    return this.http
      .get<IdAndName[]>(`${this.serverUrl}workspaces`)
      .pipe(catchError((err: ApiError) => {
        console.warn(`getWorkspaces Api-Error: ${err.code} ${err.info}`);
        return [];
      }));
  }

  setAppConfig(newConfig: AppSettings): Observable<boolean> {
    return this.http
      .patch<boolean>(`${this.serverUrl}system/config/app`, newConfig)
      .pipe(catchError((err: ApiError) => {
        console.warn(`setAppConfig Api-Error: ${err.code} ${err.info}`);
        return of(false);
      }));
  }

  setCustomTexts(newCustomTexts: KeyValuePairs): Observable<boolean> {
    return this.http
      .patch<boolean>(`${this.serverUrl}system/config/custom-texts`, newCustomTexts)
      .pipe(catchError((err: ApiError) => {
        console.warn(`setCustomTexts Api-Error: ${err.code} ${err.info}`);
        return of(false);
      }));
  }
}
