import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { samePasswordValidator } from '../../validators/samePassword.validator';
import { environment } from '../../../../environments/environment';


@Component({
    templateUrl: './new-password.component.html',
    standalone: false
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
