import { Component, OnInit } from '@angular/core';
import { MainDataService } from '../../shared/shared.module';
import { HeaderService } from '../../core/header.service';

@Component({
  templateUrl: './legal-notice.component.html',
  styles: `
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .body-text {
      font-size: larger;
    }
  `,
  standalone: false
})
export class LegalNoticeComponent implements OnInit {
  constructor(public mds: MainDataService, private headerService: HeaderService) { }

  ngOnInit(): void {
    setTimeout(() => this.mds.appSubTitle$.next('Impressum/Datenschutz'));
    this.mds.refreshSysStatus();
    this.headerService.title = 'Impressum';
  }
}
