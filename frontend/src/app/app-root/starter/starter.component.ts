import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import {
  ConfirmDialogComponent,
  CustomtextService,
  MainDataService, MessageDialogComponent, MessageDialogData,
  PasswordChangeService
} from '../../shared/shared.module';
import { BackendService } from '../../backend.service';
import { AccessObject } from '../../app.interfaces';
import { SysCheckDataService } from '../../sys-check/sys-check-data.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  templateUrl: './starter.component.html',
  styleUrls: ['./starter.component.css']
})
export class StarterComponent implements OnInit, OnDestroy {
  accessObjects: { [accessType: string]: AccessObject[] } = {};
  workspaces: AccessObject[] = [];
  private getMonitorDataSubscription: Subscription | null = null;
  private getBookletDataSubscription: Subscription | null = null;
  private getWorkspaceDataSubscription: Subscription | null = null;
  problemText: string = '';
  isSuperAdmin = false;
  constructor(
    private router: Router,
    private bs: BackendService,
    public cts: CustomtextService,
    public mds: MainDataService,
    public ds: SysCheckDataService,
    public pcs: PasswordChangeService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.ds.networkReports = [];
    setTimeout(() => {
      this.bs.getSessionData().subscribe(authData => {
        if (!authData || !authData.token) {
          this.mds.logOut();
          return;
        }
        this.accessObjects = authData.claims;
        this.mds.setAuthData(authData);

        if (
          'attachmentManager' in this.accessObjects ||
          'workspaceMonitor' in this.accessObjects ||
          'testGroupMonitor' in this.accessObjects
        ) {
          this.mds.appSubTitle$.next(this.cts.getCustomText('gm_headline'));
        } else if ('workspaceAdmin' in this.accessObjects || 'superAdmin' in this.accessObjects) {
          this.mds.appSubTitle$.next('Verwaltung: Bitte Arbeitsbereich wählen');
          if (this.getWorkspaceDataSubscription !== null) {
            this.getWorkspaceDataSubscription.unsubscribe();
          }
          this.workspaces = authData.claims.workspaceAdmin;
          this.isSuperAdmin = typeof authData.claims.superAdmin !== 'undefined';

          if (authData.pwSetByAdmin && !this.isSuperAdmin) {
            this.dialog.open(ConfirmDialogComponent, {
              data: <MessageDialogData>{
                title: 'Ihr Passwort wurde vom Administrator zurückgesetzt',
                content: 'Sie müssen im nächsten Schritt ein neues Passwort vergeben.',
                type: 'info'
              },
              disableClose: true
            }).afterClosed().subscribe(errorCode => {
              if (!errorCode) {
                this.mds.logOut();
              }

              this.pcs.showPasswordChangeDialog(
                { id: this.mds.getAuthData()?.id!, name: this.mds.getAuthData()?.displayName! },
                { disableClose: true }
              ).subscribe(error => {
                if (error) {
                  const dialog = this.dialog.open(MessageDialogComponent, {
                    width: '400px',
                    data: <MessageDialogData>{
                      title: 'Sie müssen Ihr Passwort einmalig ändern',
                      content: 'Fehler beim Ändern des Passworts. Sie werden ausgeloggt.',
                      type: 'error'
                    }
                  });

                  setTimeout(() => {
                    dialog.close();
                    this.mds.logOut();
                  }, 1500);
                }

                if (!error) {
                  const dialog = this.dialog.open(MessageDialogComponent, {
                    width: '400px',
                    data: <MessageDialogData>{
                      title: 'Passwort erfolgreich geändert',
                      content: 'Passwort erfolgreich geändert. Sie werden ausgeloggt.',
                      type: 'info'
                    }
                  });

                  setTimeout(() => {
                    dialog.close();
                    this.mds.logOut();
                  }, 1500);
                }
              });
            });
          }
        } else if ('test' in this.accessObjects) {
          this.mds.appSubTitle$.next(this.cts.getCustomText('login_subtitle'))
        }
      });
    });
  }

  startTest(test: AccessObject): void {
    this.bs.startTest(test.id).subscribe(testId => {
      if ('workspaceMonitor' in test || 'testGroupMonitor' in test || 'attachmentManager' in test) {
        const errCode = testId as number;
        if (errCode === 423) {
          this.problemText = 'Dieser Test ist gesperrt';
        } else {
          this.problemText = `Problem beim Start (${errCode})`;
        }
      } else if ('test' in test) {
        this.reloadTestList();
      } else {
        this.router.navigate(['/t', testId]);
      }
    });
  }

  changePassword(): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.pcs.showPasswordChangeDialog({ id: this.mds.getAuthData()?.id!, name: this.mds.getAuthData()?.displayName! })
      .subscribe(errorCode => {
        if (!errorCode) {
          const dialog = this.dialog.open(MessageDialogComponent, {
            width: '400px',
            data: <MessageDialogData>{
              title: 'Passwort erfolgreich geändert',
              content: 'Passwort erfolgreich geändert. Sie werden ausgeloggt.',
              type: 'info'
            }
          });

          setTimeout(() => {
            dialog.close();
            this.mds.logOut();
          }, 1500);
        }
      });
  }

  buttonGotoStudyMonitor(accessObject: AccessObject): void {
    this.router.navigateByUrl(`/sm/${accessObject.id.toString()}`);
  }

  buttonGotoMonitor(accessObject: AccessObject): void {
    let url = `/gm/${accessObject.id.toString()}`;
    if (accessObject.flags.profile) url += `/${accessObject.flags.profile}`;
    this.router.navigateByUrl(url);
  }

  buttonGotoAttachmentManager(accessObject: AccessObject) {
    this.router.navigateByUrl(`/am/${accessObject.id.toString()}`);
  }

  resetLogin(): void {
    this.mds.logOut();
  }

  private reloadTestList(): void {
    this.mds.appSubTitle$.next('Testauswahl');
    this.bs.getSessionData().subscribe(authData => {
      if (!authData || !authData.token) {
        this.mds.logOut();
      }
      this.mds.setAuthData(authData);
    });
  }

  buttonGotoWorkspaceAdmin(ws: AccessObject): void {
    this.router.navigateByUrl(`/admin/${ws.id.toString()}/files`);
  }

  ngOnDestroy(): void {
    if (this.getMonitorDataSubscription !== null) {
      this.getMonitorDataSubscription.unsubscribe();
    }

    if (this.getBookletDataSubscription !== null) {
      this.getBookletDataSubscription.unsubscribe();
    }

    if (this.getWorkspaceDataSubscription !== null) {
      this.getWorkspaceDataSubscription.unsubscribe();
    }
  }
}
