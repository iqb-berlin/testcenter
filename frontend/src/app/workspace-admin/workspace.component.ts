import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { MainDataService } from '../shared/shared.module';
import { BackendService } from './backend.service';
import { WorkspaceDataService } from './workspacedata.service';

@Component({
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  private routingSubscription: Subscription | null = null;

  constructor(private route: ActivatedRoute,
              private backendService: BackendService,
              public mainDataService: MainDataService,
              public workspaceDataService: WorkspaceDataService) { }

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
        this.backendService.getWorkspaceData(params.ws).subscribe(workspaceData => {
          if (typeof workspaceData !== 'number') {
            this.workspaceDataService.wsName = workspaceData.name;
            this.workspaceDataService.wsRole = workspaceData.role;
            this.mainDataService.appSubTitle$.next(
              `Verwaltung "${this.workspaceDataService.wsName}" (${this.workspaceDataService.wsRole})`
            );
          }
        });
      });
    });
  }

  ngOnDestroy(): void {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
