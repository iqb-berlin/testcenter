import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BackendService } from '../../backend.service';
import { AccessObject } from '../../app.interfaces';
import { MainDataService } from '../../shared/shared.module';

@Component({
  templateUrl: './admin-starter.component.html'
})

export class AdminStarterComponent implements OnInit, OnDestroy {
  workspaces: AccessObject[] = [];
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
      this.backendService.getSessionData().subscribe(authDataUntyped => {
        if (this.getWorkspaceDataSubscription !== null) {
          this.getWorkspaceDataSubscription.unsubscribe();
        }

        this.workspaces = authDataUntyped.claims.workspaceAdmin;
        this.isSuperAdmin = typeof authDataUntyped.claims.superAdmin !== 'undefined';
      });
    });
  }

  buttonGotoWorkspaceAdmin(ws: AccessObject): void {
    this.router.navigateByUrl(`/admin/${ws.id.toString()}/files`);
  }

  resetLogin(): void {
    this.mainDataService.logOut();
  }

  ngOnDestroy(): void {
    if (this.getWorkspaceDataSubscription !== null) {
      this.getWorkspaceDataSubscription.unsubscribe();
    }
  }
}
