import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { BackendService } from '../backend.service';
import { NewPasswordComponent } from '../../components/newpassword/new-password.component';

@Injectable({
  providedIn: 'root'
})
export class PasswordChangeService {
  constructor(private newpasswordDialog: MatDialog, private bs: BackendService) { }

  // `isSelfService` distinguishes a user changing their own password (current password required by
  // the backend, so the dialog must collect it) from a super-admin resetting another user's forgotten
  // password (no current password to give, so the dialog must not ask for one).
  showPasswordChangeDialog(user: { id: number; name: string }, isSelfService = false): Observable<boolean> {
    const dialogRef =
      this.newpasswordDialog.open(NewPasswordComponent, {
        width: '600px',
        data: {
          username: user.name,
          isSelfService
        }
      });

    return dialogRef.afterClosed().pipe(
      switchMap(result => {
        if (!result) {
          return of(false);
        }
        return this.bs.changePassword(
          user.id,
          result.get('pw').value,
          isSelfService ? result.get('pwOld').value : undefined
        ).pipe(
          map(() => true)
        );
      }));
  }
}
