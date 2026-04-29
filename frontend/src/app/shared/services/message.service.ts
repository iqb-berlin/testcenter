import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { DialogComponent } from '@shared/components/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private _snackBar: MatSnackBar, private dialog: MatDialog) {}

  showInfo(text: string, actionText: string = 'Schließen'): MatSnackBarRef<TextOnlySnackBar> {
    return this._snackBar.open(text, actionText, {
      duration: 5000
    });
  }

  showDialog(dialogData: DialogData): Observable<boolean> {
    return this.dialog.open(DialogComponent, {
      data: dialogData,
      autoFocus: dialogData.focusCancel ? '.cancel-button' : 'first-tabbable'
    }).afterClosed();
  }
}

export interface DialogData {
  title: string;
  content: string;
  confirmText? : string;
  cancelText? : string;
  focusCancel?: boolean;
}
