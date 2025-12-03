import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HeaderService } from '../../core/header.service';
import { MainDataService } from '../../shared/services/maindata/maindata.service';

@Component({
  selector: 'app-header',
  imports: [
    MatToolbar,
    RouterLink,
    MatTooltipModule
  ],
  template: `
    <mat-toolbar>
      @if (headerService.showLogo) {
        <a class="logo" [routerLink]="['/r']" aria-label="Gehe zur Startseite">
          <img [src]="mainDataService.appConfig?.mainLogo" data-cy="logo" alt="Logo der Anwendung"
               matTooltip="Zur Startseite"/>
        </a>
      }
    </mat-toolbar>
  `,
  styles: `
    mat-toolbar {
      display: flex;
      flex-direction: row;
    }
    .logo img {
      width: 100px;
    }
  `,
})
export class HeaderComponent {
  constructor(public headerService: HeaderService, public mainDataService: MainDataService) { }
}
