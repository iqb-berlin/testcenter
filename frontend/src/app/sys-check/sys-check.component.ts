import { ActivatedRoute, ParamMap } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CustomtextService, MainDataService } from '../shared/shared.module';
import { BackendService } from './backend.service';
import { SysCheckDataService } from './sys-check-data.service';
import { UnitAndPlayerContainer } from './sys-check.interfaces';

@Component({
  templateUrl: './sys-check.component.html',
  styleUrls: ['./sys-check.component.css']
})

export class SysCheckComponent implements OnInit {
  checkLabel = 'Bitte warten';
  constructor(
    private bs: BackendService,
    public ds: SysCheckDataService,
    private route: ActivatedRoute,
    private mds: MainDataService,
    private cts: CustomtextService
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => this.mds.appSubTitle$.next('System-Check'));
    this.route.paramMap.subscribe((params: ParamMap) => {
      const sysCheckId = params.get('sys-check-name');
      const workspaceId = parseInt(params.get('workspace-id'), 10);
      setTimeout(() => {
        this.mds.setSpinnerOn();
        this.bs.getCheckConfigData(workspaceId, sysCheckId).subscribe(checkConfig => {
          this.ds.checkConfig = checkConfig;
          if (checkConfig) {
            this.checkLabel = checkConfig.label;
            this.mds.appSubTitle$.next(`System-Check ${this.checkLabel}`);
            if (checkConfig.customTexts.length > 0) {
              const myCustomTexts: { [key: string]: string } = {};
              checkConfig.customTexts.forEach(ct => {
                myCustomTexts[ct.key] = ct.value;
              });
              this.cts.addCustomTexts(myCustomTexts);
            }
            if (checkConfig.hasUnit) {
              this.bs.getUnitAndPlayer(this.ds.checkConfig.workspaceId, this.ds.checkConfig.name)
                .subscribe((unitAndPlayer: UnitAndPlayerContainer | boolean) => {
                  if (unitAndPlayer !== false && (unitAndPlayer as UnitAndPlayerContainer).player.length > 0) {
                    this.ds.unitAndPlayerContainer = unitAndPlayer as UnitAndPlayerContainer;
                  } else {
                    console.error('Konnte Unit-Player nicht laden');
                    this.ds.checkConfig.hasUnit = false;
                    // this.ds.unitReport.push({id: 'UNIT-PLAYER-ERROR', type: 'unit/player',
                    // label: 'loading error', value: 'Error', warning: true});
                  }
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
    this.mds.setSpinnerOff();
    this.ds.loadConfigComplete = true;
    this.ds.setSteps();
    this.ds.setNewCurrentStep('w');
  }
}
