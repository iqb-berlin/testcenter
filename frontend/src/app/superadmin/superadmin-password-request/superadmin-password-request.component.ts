import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
    templateUrl: './superadmin-password-request.component.html',
    standalone: false
})

export class SuperadminPasswordRequestComponent {
  passwordform = new FormGroup({
    pw: new FormControl('', [Validators.required, Validators.minLength(7)])
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {}
}
