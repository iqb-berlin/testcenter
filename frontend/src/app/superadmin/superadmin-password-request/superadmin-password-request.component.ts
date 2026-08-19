import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, EventEmitter, Inject } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
  templateUrl: './superadmin-password-request.component.html',
  standalone: false
})

export class SuperadminPasswordRequestComponent {
  passwordform = new FormGroup({
    pw: new FormControl('', [Validators.required, Validators.minLength(7)])
  });

  errorMessage = '';

  readonly passwordSubmit = new EventEmitter<string>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {}

  submit(): void {
    if (this.passwordform.invalid) {
      return;
    }
    this.errorMessage = '';
    this.passwordSubmit.emit(this.passwordform.get('pw')?.value ?? '');
  }

  clearError(): void {
    this.errorMessage = '';
  }
}