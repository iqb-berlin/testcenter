import { Injectable, Inject, SkipSelf } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IdAndName, IdRoleData, UserData } from './superadmin.interfaces';
import { AppError, KeyValuePairs } from '../app.interfaces';
import { AppSettings } from '../shared/shared.module';

@Injectable({
  providedIn: 'root'
})

export class BackendService {
  constructor(
    @Inject('BACKEND_URL') private readonly serverUrl: string,
    @SkipSelf() private http: HttpClient
  ) {
  }

  getUsers(): Observable<UserData[]> {
    return this.http.get<UserData[]>(`${this.serverUrl}users`);
  }

  addUser(name: string, password: string): Observable<boolean> {
    return this.http.put<boolean>(`${this.serverUrl}user`, { n: name, p: password });
  }

  setSuperUserStatus(userId: number, changeToSuperUser: boolean, password: string): Observable<void> {
    return this.http
      .patch<void>(`${this.serverUrl}user/${userId}/super-admin/${changeToSuperUser ? 'on' : 'off'}`, { p: password })
      .pipe(
        catchError((err: AppError) => {
          if (err.code === 403) {
            throw new AppError({
              type: 'warning',
              description: '',
              label: 'Bitte geben Sie zur Sicherheit *Ihr eigenes* Kennwort korrekt ein!'
            });
          }
          throw err;
        })
      );
  }

  deleteUsers(users: string[]): Observable<boolean> {
    return this.http.request<boolean>('delete', `${this.serverUrl}users`, { body: { u: users } });
  }

  getWorkspacesByUser(userId: number): Observable<IdRoleData[]> {
    return this.http.get<IdRoleData[]>(`${this.serverUrl}user/${userId}/workspaces`);
  }

  setWorkspacesByUser(userId: number, accessTo: IdRoleData[]): Observable<void> {
    return this.http.patch<void>(`${this.serverUrl}user/${userId}/workspaces`, { ws: accessTo });
  }

  addWorkspace(name: string): Observable<void> {
    return this.http.put<void>(`${this.serverUrl}workspace`, { name });
  }

  renameWorkspace(workspaceId: number, wsName: string): Observable<void> {
    return this.http.patch<void>(`${this.serverUrl}workspace/${workspaceId}`, { name: wsName });
  }

  deleteWorkspaces(workspaces: number[]): Observable<void> {
    return this.http.request<void>('delete', `${this.serverUrl}workspaces`, { body: { ws: workspaces } });
  }

  getUsersByWorkspace(workspaceId: number): Observable<IdRoleData[]> {
    return this.http.get<IdRoleData[]>(`${this.serverUrl}workspace/${workspaceId}/users`);
  }

  setUsersByWorkspace(workspaceId: number, accessing: IdRoleData[]): Observable<void> {
    return this.http.patch<void>(`${this.serverUrl}workspace/${workspaceId}/users`, { u: accessing });
  }

  getWorkspaces(): Observable<IdAndName[]> {
    return this.http.get<IdAndName[]>(`${this.serverUrl}workspaces`);
  }

  setAppConfig(newConfig: AppSettings): Observable<void> {
    return this.http.patch<void>(`${this.serverUrl}system/config/app`, newConfig);
  }

  setCustomTexts(newCustomTexts: KeyValuePairs): Observable<void> {
    return this.http.patch<void>(`${this.serverUrl}system/config/custom-texts`, newCustomTexts);
  }
}
