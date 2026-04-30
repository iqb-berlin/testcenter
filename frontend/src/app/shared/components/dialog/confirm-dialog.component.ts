import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { ConfirmDialogData } from '@shared/services/message.service';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'tc-dialog',
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatDialogClose,
    NgTemplateOutlet
  ],
  template: `
    <h2 mat-dialog-title data-cy="dialog-title">{{ data.title }}</h2>

    <mat-dialog-content data-cy="dialog-content">
      @if (data.contentTemplate) {
        <ng-container *ngTemplateOutlet="data.contentTemplate"></ng-container>
      } @else {
        <p>{{ data.content }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions [align]="'start'">
      <!-- Style buttons differently depending on what the proposed action is.
           Logout should be discouraged, for example. -->
      @if (!data.focusCancel){
        <button matButton="filled" [mat-dialog-close]="true" data-cy="dialog-confirm">
          {{ data.confirmText || 'Bestätigen' }}
        </button>
        <button matButton="outlined" class="cancel-button" [mat-dialog-close]="false" data-cy="dialog-cancel">
          {{ data.cancelText || 'Abbrechen' }}
        </button>
      } @else {
        <button matButton="outlined" [mat-dialog-close]="true" data-cy="dialog-confirm">
          {{ data.confirmText || 'Bestätigen' }}
        </button>
        <button matButton="filled" class="cancel-button" [mat-dialog-close]="false" data-cy="dialog-cancel">
          {{ data.cancelText || 'Abbrechen' }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: ``,
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
