import { Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { AppErrorInterface } from '@app/app.interfaces';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import UAParser from 'ua-parser-js';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CustomtextPipe } from '@shared/pipes/customtext/customtext.pipe';

@Component({
  selector: 'app-error',
  imports: [
    MatDialogTitle,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    DatePipe,
    AsyncPipe,
    CustomtextPipe,
    MatButton,
    MatIcon,
    MatDialogContent,
    MatDialogActions
  ],
  template: `
    <h2 mat-dialog-title><mat-icon [svgIcon]="'error'"></mat-icon>{{error.label}}</h2>
    <mat-dialog-content>
      @if (error.errorId) {
        <p><b>Error-Id:</b> {{error.errorId}} {{error.testMode ? '(test-mode: ' + error.testMode + ')' : ''}}</p>
      }
      @if (isTestTaker) {
        <p class="custom-text">
          {{ '' | customtext:(error.sessionInvalid ? 'booklet_sessionerrormessage' : 'booklet_errormessage') | async }}
        </p>
      } @else if (error.sessionInvalid) {
        <p>
          Die Sitzung ist nicht mehr gültig, zum Beispiel weil mit denselben Zugangsdaten eine Anmeldung auf einem
          anderen Gerät erfolgt ist. Beim Schließen erfolgt die Abmeldung.
        </p>
      } @else {
        <p>
          Es ist ein Fehler aufgetreten. Eine mögliche Ursache ist eine unterbrochene Internetverbindung. Tritt der
          Fehler nach dem Neuladen erneut auf, kann die zuständige Administration weiterhelfen.
        </p>
      }
      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title>
            Fehlerdetails
          </mat-panel-title>
        </mat-expansion-panel-header>
        <h3>Fehlerbericht: {{error.label}}</h3>
        <p [innerHtml]="error.description"></p>
        @if (error.errorId) {
          <p><b>Error-Id:</b> {{error.errorId}}</p>
        }
        <p><b>Zeitpunkt:</b> {{timestamp | date:'medium'}}</p>
        <p><b>Url: </b>{{url}}</p>
        <p><b>Browser: </b>{{browser.browser.name}} {{browser.browser.version}}</p>
        <p><b>Betriebssystem: </b>{{browser.os.name}} {{browser.os.version}}</p>
        <p><b>Gerät: </b>{{browser.device.type}} {{browser.device.vendor}} {{browser.device.model}}</p>
        <p><b>Login: </b>{{loginName}}</p>
        <p>{{error.details}}</p>
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
    .custom-text {
      white-space: pre-wrap;
    }
  `
})
export class ErrorDialogComponent {
  readonly error = inject<AppErrorInterface>(MAT_DIALOG_DATA);
  private readonly mainDataService = inject(MainDataService);

  readonly loginName = this.mainDataService.getAuthData()?.displayName ?? '??';
  readonly isTestTaker = this.mainDataService.isTestTaker();
  readonly timestamp = Date.now();
  readonly url = window.location.href;
  readonly browser = new UAParser().getResult();

  protected onClose() {
    this.mainDataService.reloadPage(this.error.sessionInvalid);
  }
}
