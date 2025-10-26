import { Component } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
    templateUrl: './newworkspace.component.html',
    styleUrls: ['./newworkspace.component.css'],
    standalone: false
})
export class NewworkspaceComponent {
  newworkspaceform = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)])
  });
}
