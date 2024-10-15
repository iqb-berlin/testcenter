import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BackendService } from '../backend.service';
import { NewPasswordComponent } from '../../components/newpassword/new-password.component';

@Injectable({
  providedIn: 'root'
})
export class PasswordChangeService {
  constructor(
    private newpasswordDialog: MatDialog,
    private bs: BackendService,
    private snackBar: MatSnackBar
  ) { }

  showPasswordChangeDialog(user: { id: number; name: string }): void {
    const dialogRef = this.newpasswordDialog.open(NewPasswordComponent, {
      width: '600px',
      data: user.name
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      this.bs.changePassword(
        user.id,
        result.get('pw').value
      )
        .subscribe(
          respOk => {
            if (respOk) {
              this.snackBar.open('Kennwort geändert', '', { duration: 1000 });
            }
          }
        );
    });
  }
}
