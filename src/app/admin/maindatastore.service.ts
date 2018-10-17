// import { Observable } from 'rxjs/Observable';
// import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BehaviorSubject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { Injectable, Component, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

import { IqbCommonModule, ConfirmDialogComponent, ConfirmDialogData } from '../iqb-common';
import { BackendService, LoginStatusResponseData, WorkspaceData, ServerError } from './backend.service';

@Injectable({
  providedIn: 'root'
})

export class MainDatastoreService {
  public pageTitle$ = new BehaviorSubject('Teststart');
  public isAdmin$ = new BehaviorSubject<boolean>(false);
  public loginName$ = new BehaviorSubject<string>('');
  public workspaceId$ = new BehaviorSubject<number>(-1);
  public workspaceList$ = new BehaviorSubject<WorkspaceData[]>([]);
  public notLoggedInMessage$ = new BehaviorSubject<string>('');
  public adminToken$ = new BehaviorSubject<string>('');
  public isSuperadmin$ = new BehaviorSubject<boolean>(false);

  // .................................................................................
  private _lastloginname = '';

  // ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
  constructor (
    public loginDialog: MatDialog,
    public confirmDialog: MatDialog,
    private bs: BackendService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    let myToken = localStorage.getItem('at');
    if ((myToken === null) || (myToken === undefined)) {
      myToken = '';
    } else {
      this.bs.getStatus(myToken).subscribe(
        (admindata: LoginStatusResponseData) => {
          this.updateAdminStatus(admindata.admintoken, admindata.name, admindata.workspaces, admindata.is_superadmin, '');
        }, (err: ServerError) => {
          this.updateAdminStatus('', '', [], false, err.label);
      });
    }
  }

  // *******************************************************************************************************
  login(name: string, password: string) {
    this.bs.login(name, password).subscribe(
      (admindata: LoginStatusResponseData) => {
        this.updateAdminStatus(admindata.admintoken, admindata.name, admindata.workspaces,admindata.is_superadmin, '');
        // this.route.url.subscribe(segments => {
        //   const segmentsStr = segments.join('');
        //   if (segmentsStr.indexOf('/admin') < 0) {
        //     this.router.navigateByUrl('/admin');
        //   }
        // });
      }, (err: ServerError) => {
        this.updateAdminStatus('', '', [], false, err.label);
      }
    );
  }

  // *******************************************************************************************************
  logout() {
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '400px',
      height: '300px',
      data:  <ConfirmDialogData>{
        title: 'Abmelden',
        content: 'Möchten Sie sich abmelden?',
        confirmbuttonlabel: 'Abmelden'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== false) {
        this.bs.logout(this.adminToken$.getValue()).subscribe(
          logoutresponse => {
            this.updateAdminStatus('', '', [], false, '');
            this.router.navigateByUrl('/');
          }, (err: ServerError) => {
            this.updateAdminStatus('', '', [], false, err.label);
            this.router.navigateByUrl('/');
          }
        );
      }
    });
  }

  // *******************************************************************************************************
  updatePageTitle(newTitle: string) {
    this.pageTitle$.next(newTitle);
  }
  updateWorkspaceId(newId: number) {
    this.workspaceId$.next(newId);
    localStorage.setItem('ws', String(newId));
  }
  updateAdminStatus(token: string, name: string, workspaces: WorkspaceData[], is_superadmin: boolean, message: string) {
    if ((token === null) || (token.length === 0)) {
      this.isAdmin$.next(false);
      localStorage.removeItem('at');
      this.adminToken$.next('');
      this.workspaceId$.next(-1);
      this.isSuperadmin$.next(false);
      this.workspaceList$.next([]);
      this.loginName$.next('');
      this.notLoggedInMessage$.next(message);
    } else {
      this.isAdmin$.next(true);
      localStorage.setItem('at', token);
      this.adminToken$.next(token);
      if (workspaces.length > 0) {
        workspaces.sort((ws1, ws2) => {
          if (ws1.name > ws2.name) {
            return 1
          } else if (ws1.name < ws2.name) {
            return -1
          } else {
            return 0;
          }
        })
      }
      this.workspaceList$.next(workspaces);
      this.loginName$.next(name);
      this.isSuperadmin$.next(is_superadmin);
      this.notLoggedInMessage$.next('');

      // set valid workspace-id

      const wsIdStr = localStorage.getItem('ws');
      let wsId = -1;
      if (wsIdStr !== null) {
        wsId = +wsIdStr;
        if (workspaces.length > 0) {
          let newWsId = workspaces[0]['id'];
          for (let i = 0; i < workspaces.length; i++) {
            // id comes as string
            if (+workspaces[i]['id'] === wsId) {
              newWsId = wsId;
              break;
            }
          }
          this.updateWorkspaceId(newWsId);
        } else {
          this.updateWorkspaceId(-1);
        }
      } else {
        this.updateWorkspaceId(-1);
      }
    }
  }
}

