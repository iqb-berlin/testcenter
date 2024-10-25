import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { samePasswordValidator } from '../../validators/samePassword.validator';

@Component({
  templateUrl: './new-password.component.html'
})

export class NewPasswordComponent {
  newPasswordForm = new FormGroup({
    pw: new FormControl('', [Validators.required, Validators.minLength(7)]),
    pw_confirm: new FormControl('', [Validators.required, Validators.minLength(7)])
  },
  { validators: samePasswordValidator }
  );

  constructor(@Inject(MAT_DIALOG_DATA) public data: string) { }
}
