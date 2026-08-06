import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppError } from '@app/app.interfaces';
import { TestControllerService } from '@app/test-controller';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import UAParser from 'ua-parser-js';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-error',
  imports: [
    MatDialogTitle,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    DatePipe,
    MatButton,
    MatIcon,
    MatDialogContent,
    MatDialogActions
  ],
  template: `
    <h2 mat-dialog-title><mat-icon [svgIcon]="'error'"></mat-icon>{{error?.label}}</h2>
    @if (error?.errorId) {
      <p><b>Error-Id:</b> {{error?.errorId}} {{error?.testMode ? '(test-mode: ' + error?.testMode + ')' : ''}}</p>
    }
    <mat-dialog-content>
      @if (errorMessage) {
        <p style="white-space: pre-wrap">
          {{ errorMessage }}
        </p>
      } @else {
        @switch (error?.type) {
          @case ('network') {
            Leider ist ein Verbindungsfehler aufgetreten.
            Prüfen Sie Ihre Internetverbindung, laden Sie die Seite neu und probieren es noch einmal.
          }
          @case ('network_temporally') {
            Leider ist ein (vermutlich vorübergehender) Verbindungsfehler aufgetreten.
            Prüfen Sie Ihre Internetverbindung, laden Sie die Seite neu und probieren es noch einmal.
          }
          @case ('session') {
            Haben Sie sich eventuell auf einem anderen Gerät oder Browserfenster angemeldet?
            Versuchen Sie, sich neu anzumelden.
          }
          @case ('warning') {}
          @default {
            Es ist ein Programmfehler aufgetreten.
            Laden Sie die Seite neu und probieren es noch einmal. Sollte das Problem weiterhin bestehen bleiben,
            melden Sie es dem zuständigen Systemadministrator.
          }
        }
      }
      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title>
            Fehlerdetails
          </mat-panel-title>
        </mat-expansion-panel-header>
        <h3>Fehlerbericht: {{error?.label}}</h3>
        <p [innerHtml]="error?.description"></p>
        <p>{{error?.details}}</p>
        @if (error?.errorId) {
          <p><b>Error-Id:</b> {{error?.errorId}}</p>
        }
        <p><b>Zeitpunkt:</b> {{timestamp | date:'medium'}}</p>
        <p><b>Url: </b>{{url}}</p>
        <p><b>Browser: </b>{{browser?.browser?.name}} {{browser?.browser?.version}}</p>
        <p><b>Betriebssystem: </b>{{browser?.os?.name}} {{browser?.os?.version}}</p>
        <p><b>Gerät: </b>{{browser?.device?.type}} {{browser?.device?.vendor}} {{browser?.device?.model}}</p>
        <p><b>Booklet: </b>{{ tcs.booklet?.metadata?.label || tcs.booklet?.metadata?.id || '' }}</p>
        <p><b>Login: </b>{{loginName}}</p>
        <p><b>Mode: </b>{{ tcs.testMode.modeLabel }}</p>

        @if (errorBuffer.length) {
          <p><b>Weitere Fehler:</b></p>
          <div>
            @for (err of errorBuffer; track err.label) {
              <p><b>{{err.label}}: </b>{{err.description}}</p>
              <p>{{err.details}}</p>
              @if (err.errorId) {
                <p><b>Error-Id:</b> {{err.errorId}}</p>
              }
            }
          </div>
        }
      </mat-expansion-panel>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-raised-button (click)="onClose()" data-cy="close">
        Schließen und neu laden
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .mat-mdc-dialog-actions {
      --mat-dialog-actions-alignment: center;
    }
    h2 mat-icon {
      margin-right: 15px;
      color: #A92319
    }
    .mat-expansion-panel {
      margin-bottom: 10px;
    }
  `
})
export class ErrorDialogComponent implements OnInit {
  errorMessage = inject<string>(MAT_DIALOG_DATA);
  private appErrorSubscription: Subscription | null = null;

  error: AppError | null = null;
  errorBuffer: AppError[] = [];
  loginName: string = '??';
  timestamp: number = -1;
  url: string = '';
  browser: UAParser.IResult | null = null;

  constructor(public tcs: TestControllerService, public mainDataService: MainDataService) {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      this.loginName = authData.displayName;
    }
  }

  ngOnInit(): void {
    this.browser = new UAParser().getResult();
    this.appErrorSubscription = this.mainDataService.appError$
      .subscribe(err => {
        if (this.error) {
          this.errorBuffer.push(this.error);
        }
        this.error = err;

        this.url = window.location.href;
        this.timestamp = Date.now();
      });
  }

  protected onClose() {
    if (this.error?.type === 'session') {
      this.mainDataService.logOut();
    } else {
      this.mainDataService.reloadPage();
    }
  }

  ngOnDestroy(): void {
    this.appErrorSubscription?.unsubscribe();
  }
}
