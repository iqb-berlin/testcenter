import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private _snackBar: MatSnackBar) {}

  showError(text: string): void {
    this._snackBar.open(text, 'Fehler', { duration: 3000 });
  }
}
