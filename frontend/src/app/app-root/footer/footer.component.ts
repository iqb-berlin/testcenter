import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { MainDataService } from '../../shared/services/maindata/maindata.service';

@Component({
  selector: 'tc-footer',
  imports: [
    NgIf
  ],
  template: `
    <footer>
      footer works!
      <div class="version-label">
        <span *ngIf="mainDataService.isTestingMode" style="color:red">Testmode!</span>
        IQB-Testcenter Version {{mainDataService.appConfig?.version}}
      </div>
    </footer>
  `,
  styles: `
    footer {
      height: 24px;
      background: var(--theme-Gray-05, #F4F2F2);
    }
  `
})
export class FooterComponent {
  constructor(public mainDataService: MainDataService) {
  }
}
