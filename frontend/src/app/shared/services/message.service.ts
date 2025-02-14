import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private _snackBar: MatSnackBar) {}

  show(text: string): void {
    this._snackBar.open(text, 'Schließen', {
      duration: 5000,
      panelClass: ['snackbar-demo-mode']
    });
  }
}
