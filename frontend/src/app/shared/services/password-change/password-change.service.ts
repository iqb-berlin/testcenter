import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, switchMap } from 'rxjs';
import { BackendService } from '../backend.service';
import { NewPasswordComponent } from '../../components/newpassword/new-password.component';

@Injectable({
  providedIn: 'root'
})
export class PasswordChangeService {
  constructor(private newpasswordDialog: MatDialog, private bs: BackendService) { }

  showPasswordChangeDialog(user: { id: number; name: string }): Observable<boolean> {
    const dialogRef =
      this.newpasswordDialog.open(NewPasswordComponent, {
        width: '600px',
        data: user.name
      });

    return dialogRef.afterClosed().pipe(
      switchMap(result => {
        if (!result) {
          return of(false);
        }
        return this.bs.changePassword(
          user.id,
          result.get('pw').value
        );
      }));
  }
}
