import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
    templateUrl: './confirm-with-password.component.html',
    standalone: false
})

export class ConfirmWithPasswordComponent {
  passwordform = new FormGroup({
    pw: new FormControl('', [Validators.required, Validators.minLength(7)])
  });

  // `content` and `confirmText` are optional: callers that only need a title (plus the fixed
  // "please re-enter your password" wording and default "Bestätigen") can omit both.
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; content?: string; confirmText?: string }
  ) {}
}
