import { Injectable, TemplateRef } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../components/dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { InfoDialogComponent } from '@shared/components/dialog/info-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private _snackBar: MatSnackBar, private dialog: MatDialog) {}

  showSnackbar(text: string, actionText: string = 'Schließen'): MatSnackBarRef<TextOnlySnackBar> {
    return this._snackBar.open(text, actionText, {
      duration: 5000
    });
  }

  showConfirmDialog(dialogData: ConfirmDialogData): Observable<boolean> {
    return this.dialog.open(ConfirmDialogComponent, {
      data: dialogData,
      autoFocus: dialogData.focusCancel ? '.cancel-button' : 'first-tabbable'
    }).afterClosed();
  }

  showInfoDialog(dialogData: DialogData): Observable<boolean> {
    return this.dialog.open(InfoDialogComponent, {
      data: dialogData,
      autoFocus: 'dialog'
    }).afterClosed();
  }
}

interface BaseDialogData {
  title: string;
}

// Dialog content can be either a string or a template. Template can be used for formatted content.
export type DialogData =
  (BaseDialogData & { content: string; contentTemplate?: never }) |
  (BaseDialogData & { content?: never; contentTemplate: TemplateRef<unknown> });

export type ConfirmDialogData = DialogData & {
  confirmText? : string;
  cancelText? : string;
  focusCancel?: boolean;
};
