import { Component, Inject, OnInit } from '@angular/core';
import { MainDataService } from '../../shared/shared.module';

@Component({
  templateUrl: './legal-notice.component.html',
  styles: [
    'mat-card {margin: 10px}'
  ]
})
export class LegalNoticeComponent implements OnInit {
  constructor(
    @Inject('APP_NAME') public appName: string,
    @Inject('APP_PUBLISHER') public appPublisher: string,
    @Inject('APP_VERSION') public appVersion: string,
    @Inject('VERONA_PLAYER_API_VERSION_MIN') public veronaPlayerApiVersionMin: number,
    @Inject('VERONA_PLAYER_API_VERSION_MAX') public veronaPlayerApiVersionMax: number,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean,
    public mds: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => this.mds.appSubTitle$.next('Impressum/Datenschutz'));
  }
}
