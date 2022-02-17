import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MainDataService } from '../shared/shared.module';
import { BackendService } from './backend.service';
import { WorkspaceDataService } from './workspacedata.service';

@Component({
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  private routingSubscription: Subscription = null;

  constructor(
    private route: ActivatedRoute,
    private bs: BackendService,
    public mds: MainDataService,
    public wds: WorkspaceDataService
  ) { }

  navLinks = [
    { path: 'files', label: 'Dateien' },
    { path: 'syscheck', label: 'System-Check Berichte' },
    { path: 'results', label: 'Ergebnisse/Antworten' }
  ];

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.appSubTitle$.next('');
      this.routingSubscription = this.route.params.subscribe(params => {
        this.wds.wsId = params.ws;
        this.bs.getWorkspaceData(this.wds.wsId).subscribe(wsData => {
          if (typeof wsData !== 'number') {
            this.wds.wsName = wsData.name;
            this.wds.wsRole = wsData.role;
            this.mds.appSubTitle$.next(`Verwaltung "${this.wds.wsName}" (${this.wds.wsRole})`);
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
