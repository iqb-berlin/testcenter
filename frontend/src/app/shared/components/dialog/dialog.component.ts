import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { DialogData } from '@shared/services/message.service';

@Component({
  selector: 'tc-dialog',
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatDialogClose
  ],
  template: `
    <h2 mat-dialog-title data-cy="dialog-title">{{ data.title }}</h2>

    <mat-dialog-content data-cy="dialog-content">
      <p>{{ data.content }}</p>
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
export class DialogComponent {
  data = inject<DialogData>(MAT_DIALOG_DATA);
}
