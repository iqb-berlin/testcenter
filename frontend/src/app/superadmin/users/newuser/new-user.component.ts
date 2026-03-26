import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
    templateUrl: './new-user.component.html',
    standalone: false
})

export class NewUserComponent {
  newUserForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    pw: new FormControl('', [Validators.required, Validators.minLength(environment.passwordMinLength)])
  });

  passwordMinLength = environment.passwordMinLength
}
