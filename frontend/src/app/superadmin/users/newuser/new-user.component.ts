import { Component, Inject } from '@angular/core';
import {
  FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import {
  MatError, MatFormField, MatInput, MatLabel
} from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormField,
    MatInput,
    MatButton,
    MatError,
    MatLabel
  ],
  templateUrl: './new-user.component.html',
  styles: `
    mat-form-field {display: flex; flex-direction: column;}
  `
})

export class NewUserComponent {
  newUserForm;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { username: string }, public mds: MainDataService) {
    this.newUserForm = this.initForm();
  }

  initForm(): FormGroup {
    if (!this.mds.appConfig) throw new Error('App config not available');
    return new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(3)]),
      pw: new FormControl('', [
        Validators.required,
        Validators.minLength(this.mds.appConfig.passwordMinLength),
        Validators.pattern(new RegExp(this.mds.appConfig.passwordPattern))
      ])
    });
  }
}
