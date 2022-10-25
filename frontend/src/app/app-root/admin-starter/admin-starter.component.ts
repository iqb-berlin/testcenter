import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { from, Subscription } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { BackendService } from '../../backend.service';
import { AuthAccessKeyType, AuthData, WorkspaceData } from '../../app.interfaces';
import { MainDataService } from '../../shared/shared.module';

@Component({
  templateUrl: './admin-starter.component.html',
  styles: [
    'mat-card {margin: 10px;}',
    '.mat-card-box {background-color: var(--tc-box-background)}'
  ]
})

export class AdminStarterComponent implements OnInit, OnDestroy {
  workspaces: WorkspaceData[] = [];
  isSuperAdmin = false;
  private getWorkspaceDataSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private backendService: BackendService,
    public mainDataService: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.mainDataService.appSubTitle$.next('Verwaltung: Bitte Arbeitsbereich wählen');
      this.mainDataService.showLoadingAnimation();
      this.backendService.getSessionData().subscribe(authDataUntyped => {
        if (this.getWorkspaceDataSubscription !== null) {
          this.getWorkspaceDataSubscription.unsubscribe();
        }

        if (typeof authDataUntyped !== 'number') {
          const authData = authDataUntyped as AuthData;
          if (authData) {
            if (authData.token) {
              if (authData.access[AuthAccessKeyType.SUPER_ADMIN]) {
                this.isSuperAdmin = true;
              }
              if (authData.access[AuthAccessKeyType.WORKSPACE_ADMIN]) {
                this.workspaces = [];
                this.getWorkspaceDataSubscription = from(authData.access[AuthAccessKeyType.WORKSPACE_ADMIN])
                  .pipe(
                    concatMap(workspaceId => this.backendService.getWorkspace(workspaceId))
                  ).subscribe(
                    wsData => this.workspaces.push(wsData),
                    () => this.mainDataService.stopLoadingAnimation(),
                    () => this.mainDataService.stopLoadingAnimation()
                  );
              } else {
                this.mainDataService.stopLoadingAnimation();
              }
              this.mainDataService.setAuthData(authData);
            } else {
              this.mainDataService.setAuthData();
              this.mainDataService.stopLoadingAnimation();
            }
          } else {
            this.mainDataService.setAuthData();
            this.mainDataService.stopLoadingAnimation();
          }
        } else {
          this.mainDataService.stopLoadingAnimation();
        }
      });
    });
  }

  buttonGotoWorkspaceAdmin(ws: WorkspaceData): void {
    this.router.navigateByUrl(`/admin/${ws.id.toString()}/files`);
  }

  resetLogin(): void {
    this.mainDataService.setAuthData();
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.getWorkspaceDataSubscription !== null) {
      this.getWorkspaceDataSubscription.unsubscribe();
    }
  }
}
