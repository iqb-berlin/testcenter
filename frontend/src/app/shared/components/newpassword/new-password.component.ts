import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { samePasswordValidator } from '../../validators/samePassword.validator';

const UpperLowerSymbolNumber = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/;

@Component({
  templateUrl: './new-password.component.html'
})

export class NewPasswordComponent {
  newPasswordForm = new FormGroup({
    pw: new FormControl('', [Validators.required, Validators.minLength(10), Validators.pattern(UpperLowerSymbolNumber)]),
    pw_confirm: new FormControl('', [Validators.required, Validators.minLength(10), Validators.pattern(UpperLowerSymbolNumber)])
  },
  { validators: samePasswordValidator }
  );

  constructor(@Inject(MAT_DIALOG_DATA) public data: string) { }
}
