import { Component, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { HeaderService } from '../../core/header.service';
import { MainDataService } from '../../shared/services/maindata/maindata.service';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

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
      <div>
        @if (headerService.showLogo) {
          <a class="logo" [routerLink]="['/r']" aria-label="Gehe zur Startseite">
            <img [src]="mainDataService.appConfig?.mainLogo" data-cy="logo" alt="Logo der Anwendung"
                 matTooltip="Zur Startseite"/>
          </a>
        }
      </div>
      <div>
        @if (headerService.title) {
          <h1>{{ headerService.title }}</h1>
        }
      </div>
      <div>
        @if (headerService.showAccountPanel) {
          <button matIconButton cdkOverlayOrigin #trigger="cdkOverlayOrigin"
                  (click)="isOpen = !isOpen">
            <mat-icon>person</mat-icon>
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
    </mat-toolbar>
  `,
  styles: `
    mat-toolbar {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      background-color: lightgray; /* TODO weg */
    }
    .logo img {
      width: 100px;
    }
    .overlay {
      background-color: lightgray;
    }
    .overlay dt {
      font-weight: bold;
    }
  `,
})
export class HeaderComponent implements OnDestroy {
  protected isOpen: boolean = false;
  constructor(public headerService: HeaderService, public mainDataService: MainDataService) { }

  ngOnDestroy(): void {
    this.headerService.reset();
  }
}
