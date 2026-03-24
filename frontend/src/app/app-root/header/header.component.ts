import { Component, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle
} from '@angular/material/card';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { HeaderService } from '../../core/header.service';
import { MainDataService } from '../../shared/services/maindata/maindata.service';

@Component({
  selector: 'tc-header',
  imports: [
    MatToolbar,
    RouterLink,
    MatTooltipModule,
    MatIconButton,
    MatIcon,
    OverlayModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    MatButton
  ],
  template: `
    <mat-toolbar>
      <!-- Wrapper divs are necessary for fixing positions, in case items are missing. -->
      <div class="side">
        @if (headerService.showAccountPanel) {
          <button matIconButton cdkOverlayOrigin #trigger="cdkOverlayOrigin"
                  (click)="isOpen = !isOpen">
            <mat-icon svgIcon="person"></mat-icon>
          </button>
          <ng-template cdkConnectedOverlay [cdkConnectedOverlayOrigin]="trigger"
                       [cdkConnectedOverlayOpen]="isOpen" (detach)="isOpen = false">
            <div class="overlay">
              <mat-card class="example-card" appearance="outlined">
                <mat-card-header>
                  <div mat-card-avatar class="example-header-image"></div>
                  <mat-card-title>Nutzerinformationen</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <dl>
                    <dt>Anmeldename:</dt>
                    <dd>{{ headerService.accountName }}</dd>
                    <dt>Gruppe:</dt>
                    <dd>TODO</dd>
                    <dt>Berechtigung:</dt>
                    <dd>TODO</dd>
                  </dl>
                </mat-card-content>
                <mat-card-actions>
                  <button matButton>LIKE</button>
                  <button matButton>SHARE</button>
                </mat-card-actions>
              </mat-card>
            </div>
          </ng-template>
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
  styles: `
    mat-toolbar {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }
    .side {
      width: 15%;
      height: 100%;
      display: flex;
      align-items: center;
    }
    .center {
      width: 85%;
      display: flex;
      justify-content: center;
    }
    .logo {
      justify-content: end;
    }
    .logo a {
      height: 100%;
    }
    .logo img {
      height: 100%;
    }
    .overlay {
      background-color: lightgray;
    }
    .overlay dt {
      font-weight: bold;
    }
    h1 {
      color: var(--mat-sys-on-primary);
    }
  `
})
export class HeaderComponent implements OnDestroy {
  protected isOpen: boolean = false;
  constructor(public headerService: HeaderService, public mainDataService: MainDataService) { }

  ngOnDestroy(): void {
    this.headerService.reset();
  }
}
