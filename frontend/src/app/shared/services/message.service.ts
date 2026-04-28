import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private _snackBar: MatSnackBar) {}

  showInfo(text: string, actionText: string = 'Schließen'): MatSnackBarRef<TextOnlySnackBar> {
    return this._snackBar.open(text, actionText, {
      duration: 5000
    });
  }
}
