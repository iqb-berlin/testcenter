import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import {
  FormGroup, Validators, FormControl, ReactiveFormsModule
} from '@angular/forms';
import { MatError, MatFormField, MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { samePasswordValidator } from '../../validators/samePassword.validator';
import { environment } from '../../../../environments/environment';


@Component({
  templateUrl: './new-password.component.html',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormField,
    MatError,
    MatButton,
    MatInput
  ],
  styles: `
    mat-dialog-content {
      display: flex;
      flex-direction: column;
    }
  `
})

export class NewPasswordComponent {
  newPasswordForm = new FormGroup({
    pw: new FormControl('', [Validators.required, Validators.minLength(environment.passwordMinLength)]),
    pw_confirm: new FormControl('', [Validators.required, Validators.minLength(environment.passwordMinLength)])
  },
  { validators: samePasswordValidator }
  );

  passwordMinLength = environment.passwordMinLength

  constructor(@Inject(MAT_DIALOG_DATA) public data: string) { }
}
