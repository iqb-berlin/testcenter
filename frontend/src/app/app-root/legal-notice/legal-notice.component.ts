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
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean,
    public mds: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => this.mds.appSubTitle$.next('Impressum/Datenschutz'));
  }
}
