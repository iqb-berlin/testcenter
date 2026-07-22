import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import {
  FormGroup, Validators, FormControl, ReactiveFormsModule
} from '@angular/forms';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { samePasswordValidator } from '../../validators/samePassword.validator';
import { MainDataService } from '@shared/services/maindata/maindata.service';

@Component({
  templateUrl: './new-password.component.html',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormField,
    MatError,
    MatButton,
    MatInput,
    MatLabel
  ],
  styles: `
    mat-dialog-content {
      display: flex;
      flex-direction: column;
    }
  `
})

export class NewPasswordComponent {
  newPasswordForm;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { username: string }, public mds: MainDataService) {
    this.newPasswordForm = this.initForm();
  }

  initForm(): FormGroup {
    if (!this.mds.appConfig) throw new Error('App config not available');
    return new FormGroup({
      pw: new FormControl(
        '',
        [
          Validators.required,
          Validators.minLength(this.mds.appConfig.passwordMinLength),
          Validators.pattern(new RegExp(this.mds.appConfig.passwordPattern))
        ]
      ),
      pw_confirm: new FormControl(
        '',
        [
          Validators.required,
          Validators.minLength(this.mds.appConfig.passwordMinLength),
          Validators.pattern(new RegExp(this.mds.appConfig.passwordPattern))
        ]
      )
    }, { validators: samePasswordValidator });
  }
}
