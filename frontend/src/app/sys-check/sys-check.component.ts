import { ActivatedRoute, ParamMap } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CustomtextService, MainDataService } from '../shared/shared.module';
import { BackendService } from './backend.service';
import { SysCheckDataService } from './sys-check-data.service';
import { AppError } from '../app.interfaces';

@Component({
    templateUrl: './sys-check.component.html',
    styleUrls: ['./sys-check.component.css'],
    standalone: false
})

export class SysCheckComponent implements OnInit {
  checkLabel = '';
  constructor(
    private bs: BackendService,
    public ds: SysCheckDataService,
    private route: ActivatedRoute,
    private mds: MainDataService,
    private cts: CustomtextService
  ) {
  }

  ngOnInit(): void {
    this.ds.networkReports = [];
    setTimeout(() => this.mds.appSubTitle$.next('System-Check'));
    this.route.paramMap.subscribe((params: ParamMap) => {
      const sysCheckId = params.get('sys-check-name');
      const workspaceId = params.get('workspace-id');
      if (!sysCheckId || !workspaceId) {
        throw new AppError({
          description: '', label: 'Invalid Route Parameters', type: 'script'
        });
      }
      setTimeout(() => {
        this.bs.getCheckConfigData(parseInt(workspaceId, 10), sysCheckId).subscribe(checkConfig => {
          this.ds.checkConfig = checkConfig;
          if (checkConfig) {
            this.checkLabel = checkConfig.label;
            this.mds.appSubTitle$.next(`System-Check ${this.checkLabel}`);
            if (Object.values(checkConfig.customTexts).length > 0) {
              const myCustomTexts: { [key: string]: string } = {};
              Object.values(checkConfig.customTexts).forEach(ct => {
                myCustomTexts[ct.key] = ct.value;
              });
              this.cts.addCustomTexts(myCustomTexts);
            }
            if (checkConfig.hasUnit) {
              this.bs.getUnitAndPlayer(this.ds.checkConfig.workspaceId, this.ds.checkConfig.name)
                .subscribe(unitAndPlayer => {
                  this.ds.unitAndPlayerContainer = unitAndPlayer;
                  this.completeConfig();
                });
            } else {
              this.completeConfig();
            }
          } else {
            this.checkLabel = `Fehler beim Laden der Konfiguration ${workspaceId}/${sysCheckId}`;
            this.completeConfig();
          }
        });
      });
    });
  }

  private completeConfig() {
    this.ds.loadConfigComplete = true;
    this.ds.setSteps();
    this.ds.setNewCurrentStep('w');
  }
}
