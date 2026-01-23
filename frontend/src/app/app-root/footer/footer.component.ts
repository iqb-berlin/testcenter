import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { MainDataService } from '../../shared/services/maindata/maindata.service';
import { MatButton } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'tc-footer',
  imports: [
    NgIf,
    MatButton,
    RouterLink
  ],
  template: `
    <footer>
      footer works!
      <div class="version-label">
        <span *ngIf="mainDataService.isTestingMode" style="color:red">Testmode!</span>
        IQB-Testcenter Version {{mainDataService.appConfig?.version}}
      </div>

      <button matButton [routerLink]="['/r/admin-login']">Admin-Bereich</button>
      <button matButton *ngIf="this.mainDataService.sysCheckAvailableForAll" data-cy="general-sys-check"
         [routerLink]="['/r/check-starter']">
        System-Check
      </button>
      <button matButton [routerLink]="['/legal-notice']">Impressum/Datenschutz</button>

    </footer>
  `,
  styles: `
    footer {
      height: 24px;
      padding: 16px;
      background: var(--theme-Gray-05, #F4F2F2);
      display: flex;
      flex-direction: row;
    }
  `
})
export class FooterComponent {
  constructor(public mainDataService: MainDataService, private router: Router) {
  }
}
