import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {IdAndName, IdLabelSelectedData, IdRoleData, UserData} from "./superadmin.interfaces";
import {ApiError} from "../app.interfaces";


@Injectable({
  providedIn: 'root'
})

export class BackendService {

  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient) {
  }

  getUsers(): Observable<UserData[]> {
    return this.http
      .get<UserData[]>(this.serverUrl + 'users')
      .pipe(catchError((err: ApiError) => {
        console.warn(`getUsers Api-Error: ${err.code} ${err.info} `);
        return []
      }));
  }

  addUser(name: string, password: string): Observable<Boolean> {
    return this.http
      .put<Boolean>(this.serverUrl + 'user', {n: name, p: password})
      .pipe(catchError((err: ApiError) => {
        console.warn(`addUser Api-Error: ${err.code} ${err.info} `);
        return of(false)
      }));
  }

  changePassword(userId: number, password: string): Observable<Boolean> {
    return this.http
      .patch<Boolean>(this.serverUrl + `user/${userId}/password`, {p: password})
      .pipe(catchError((err: ApiError) => {
        console.warn(`changePassword Api-Error: ${err.code} ${err.info} `);
        return of(false)
      }));
  }

  setSuperUserStatus(userId: number, changeToSuperUser: boolean, password: string): Observable<Boolean> {
    return this.http
      .patch<Boolean>(this.serverUrl + `user/${userId}/super-admin/` + (changeToSuperUser ? 'on' : 'off'), {p: password})
      .pipe(catchError((err: ApiError) => {
        console.warn(`setSuperUserStatus Api-Error: ${err.code} ${err.info} `);
        return of(false)
      }));
  }

  deleteUsers(users: string[]): Observable<Boolean> {

    return this.http
      .request<boolean>('delete', this.serverUrl + 'users', {body: {u: users}})
      .pipe(catchError((err: ApiError) => {
        console.warn(`deleteUsers Api-Error: ${err.code} ${err.info} `);
        return of(false)
      }));
  }

  getWorkspacesByUser(userId: number): Observable<IdRoleData[]> {
    return this.http
      .get<IdLabelSelectedData[]>(this.serverUrl + `user/${userId}/workspaces`)
      .pipe(catchError((err: ApiError) => {
        console.warn(`getWorkspacesByUser Api-Error: ${err.code} ${err.info} `);
        return []
      }));
  }

  setWorkspacesByUser(userId: number, accessTo: IdRoleData[]): Observable<Boolean> {
    return this.http
      .patch<Boolean>(this.serverUrl + `user/${userId}/workspaces`, {ws: accessTo})
      .pipe(catchError((err: ApiError) => {
        console.warn(`setWorkspacesByUser Api-Error: ${err.code} ${err.info} `);
        return of(false)
      }));
  }

  addWorkspace(name: string): Observable<Boolean> {
    return this.http
      .put<Boolean>(this.serverUrl + 'workspace', {name: name})
      .pipe(catchError((err: ApiError) => {
        console.warn(`addWorkspace Api-Error: ${err.code} ${err.info} `);
        return of(false)
      }));
  }

  renameWorkspace(workspaceId: number, wsName: string): Observable<Boolean> {
    return this.http
      .patch<Boolean>(this.serverUrl + `workspace/${workspaceId}`, {name: wsName})
      .pipe(catchError((err: ApiError) => {
        console.warn(`renameWorkspace Api-Error: ${err.code} ${err.info} `);
        return of(false)
      }));
  }

  deleteWorkspaces(workspaces: number[]): Observable<Boolean> {
    return this.http
      .request<Boolean>('delete', this.serverUrl + 'workspaces', {body: {ws: workspaces}})
      .pipe(catchError((err: ApiError) => {
        console.warn(`deleteWorkspaces Api-Error: ${err.code} ${err.info} `);
        return of(false)
      }));
  }

  getUsersByWorkspace(workspaceId: number): Observable<IdRoleData[]> {
    return this.http
      .get<IdRoleData[]>(this.serverUrl + `workspace/${workspaceId}/users`)
      .pipe(catchError((err: ApiError) => {
        console.warn(`getUsersByWorkspace Api-Error: ${err.code} ${err.info} `);
        return []
      }));
  }

  setUsersByWorkspace(workspaceId: number, accessing: IdRoleData[]): Observable<Boolean> {
    return this.http
      .patch<Boolean>(this.serverUrl + `workspace/${workspaceId}/users`, {u: accessing})
      .pipe(catchError((err: ApiError) => {
        console.warn(`setUsersByWorkspace Api-Error: ${err.code} ${err.info} `);
        return of(false)
      }));
  }

  getWorkspaces(): Observable<IdAndName[]> {
    return this.http
      .get<IdAndName[]>(this.serverUrl + 'workspaces')
      .pipe(catchError((err: ApiError) => {
        console.warn(`getWorkspaces Api-Error: ${err.code} ${err.info} `);
        return []
      }));
  }
}
