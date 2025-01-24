import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';

const UpperLowerSymbolNumber = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/;

@Component({
  templateUrl: './superadmin-password-request.component.html'
})

export class SuperadminPasswordRequestComponent {
  passwordform = new FormGroup({
    pw: new FormControl('', [Validators.required, Validators.minLength(10), Validators.pattern(UpperLowerSymbolNumber)])
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {}
}
