import { Component, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { HeaderService } from '@shared/services/header.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';

@Component({
  selector: 'tc-header',
  imports: [
    MatToolbar,
    RouterLink,
    MatTooltipModule,
    MatIconButton,
    MatIcon,
    OverlayModule,
    MatButton,
    MatMenu,
    MatMenuTrigger,
    MatDivider
  ],
  template: `
    <mat-toolbar>
      <!-- Wrapper divs are necessary for fixing positions, in case items are missing. -->
      <div class="side">
        @if (headerService.showAccountPanel) {
          <button matIconButton class="account-button" [matMenuTriggerFor]="accountMenu">
            <mat-icon svgIcon="person"></mat-icon>
          </button>
          <mat-menu #accountMenu="matMenu" class="account-menu">
            <div class="heading">
              <div>Nutzerinformationen</div>
              <button matIconButton>
                <mat-icon svgIcon="close"></mat-icon>
              </button>
            </div>
            <dl>
              <dt>Anmeldename:</dt>
              <dd>{{ mainDataService.getAuthData()?.loginName }}</dd>
              <dt>Gruppe:</dt>
              <dd>{{ mainDataService.getAuthData()?.groupLabel }}</dd>
              <dt>Version:</dt>
              <dd>{{ mainDataService.appConfig?.version }}</dd>
            </dl>
            <mat-divider></mat-divider>
            <button matButton="tonal" class="logout-button" (click)="mainDataService.logOut()">
              Abmelden
            </button>
          </mat-menu>
        }
      </div>
      <div class="center">
        @if (headerService.title) {
          <h1>{{ headerService.title }}</h1>
        }
      </div>
      <div class="side logo">
        @if (headerService.showLogo) {
          <a [routerLink]="['/r']" aria-label="Gehe zur Startseite">
            <img [src]="mainDataService.appConfig?.mainLogo" data-cy="logo" alt="Logo der Anwendung"
                 matTooltip="Zur Startseite"/>
          </a>
        }
      </div>
    </mat-toolbar>
  `,
  styleUrl: 'header.component.scss'
})
export class HeaderComponent implements OnDestroy {
  constructor(public headerService: HeaderService, public mainDataService: MainDataService) { }

  ngOnDestroy(): void {
    this.headerService.reset();
  }
}
