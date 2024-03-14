import { Component, Inject, OnInit } from '@angular/core';
import { MainDataService } from '../../shared/shared.module';
import { ServiceStatus } from '../../shared/interfaces/service-status.interfaces';

@Component({
  templateUrl: './legal-notice.component.html',
  styles: [
    'mat-card { width: 500px; }',
    'ul { margin-top: 0; }',
    'h1 {margin-block-start: 5%}',
    'mat-card-actions {padding-top: 30px;}'
  ]
})
export class LegalNoticeComponent implements OnInit {
  readonly translations: { [status in ServiceStatus]: string } = {
    on: 'An',
    off: 'Aus',
    unreachable: 'Nicht erreichbar',
    unknown: 'Unbekannt'
  };

  constructor(
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean,
    @Inject('BACKEND_URL') public backendUrl: string,
    public mds: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => this.mds.appSubTitle$.next('Impressum/Datenschutz'));
    this.mds.refreshSysStatus();
  }
}
