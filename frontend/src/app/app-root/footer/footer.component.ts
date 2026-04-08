import { Component } from '@angular/core';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'tc-footer',
  imports: [
    MatButton,
    RouterLink
  ],
  template: `
    <footer>
      <div class="version-label">
        @if (mainDataService.isTestingMode) {
          <span style="color:red">Testmode!</span>
        }
        IQB-Testcenter Version {{mainDataService.appConfig?.version}}
      </div>
      <div class="all-buttons">
        <button matButton [routerLink]="['/legal-notice']">Barrierefreiheit</button>
        <button matButton [routerLink]="['/legal-notice']">Impressum/Datenschutz</button>
      </div>
    </footer>
  `,
  styles: `
    footer {
      height: 24px;
      padding: 16px;
      background: var(--theme-gray-05, #F4F2F2);
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }
    .all-buttons {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
    }
    footer button {
      max-height: 100%;
    }
  `
})
export class FooterComponent {
  constructor(public mainDataService: MainDataService) {
  }
}
