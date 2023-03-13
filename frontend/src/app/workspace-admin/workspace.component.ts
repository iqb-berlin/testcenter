import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MainDataService } from '../shared/shared.module';
import { WorkspaceDataService } from './workspacedata.service';

@Component({
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  private routingSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    public mainDataService: MainDataService,
    public workspaceDataService: WorkspaceDataService,
    private router: Router
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    };
  }

  navLinks = [
    { path: 'files', label: 'Dateien' },
    { path: 'syscheck', label: 'System-Check Berichte' },
    { path: 'results', label: 'Ergebnisse/Antworten' }
  ];

  ngOnInit(): void {
    setTimeout(() => {
      this.mainDataService.appSubTitle$.next('');
      this.routingSubscription = this.route.params.subscribe((params: Params) => {
        this.workspaceDataService.workspaceID = params.ws;
        const workspace = this.mainDataService.getAccessObject('workspaceAdmin', params.ws);
        this.workspaceDataService.wsName = workspace.label;
        this.workspaceDataService.wsRole = workspace.flags.mode;
        this.mainDataService.appSubTitle$.next(
          `Verwaltung "${this.workspaceDataService.wsName}" (${this.workspaceDataService.wsRole})`
        );
      });
    });
  }

  ngOnDestroy(): void {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
