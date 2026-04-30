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

    <mat-dialog-actions>
      <button matButton [mat-dialog-close]="true" data-cy="dialog-confirm">
        {{ data.confirmText || 'Bestätigen' }}
      </button>
      <button mat-raised-button class="cancel-button" [mat-dialog-close]="false" data-cy="dialog-cancel">
        {{ data.cancelText || 'Abbrechen' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
