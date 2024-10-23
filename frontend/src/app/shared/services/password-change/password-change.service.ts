import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Observable, of, switchMap } from 'rxjs';
import { BackendService } from '../backend.service';
import { NewPasswordComponent } from '../../components/newpassword/new-password.component';

@Injectable({
  providedIn: 'root'
})
export class PasswordChangeService {
  constructor(
    private newpasswordDialog: MatDialog,
    private bs: BackendService
  ) { }

  showPasswordChangeDialog(user: { id: number; name: string }, option: MatDialogConfig = {}): Observable<boolean> {
    const dialogRef = this.newpasswordDialog.open(NewPasswordComponent,
      {
        width: '600px',
        data: user.name,
        ...option
      });

    return dialogRef.afterClosed().pipe(
      switchMap(result => {
        if (!result) {
          return of(true); // true in sense of "errorCode other than 0"
        }
        return this.bs.changePassword(
          user.id,
          result.get('pw').value
        );
      }));
  }
}
