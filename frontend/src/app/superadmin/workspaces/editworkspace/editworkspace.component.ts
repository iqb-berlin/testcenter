import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
    templateUrl: './editworkspace.component.html',
    styleUrls: ['./editworkspace.component.css'],
    standalone: false
})
export class EditworkspaceComponent {
  editworkspaceform = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)])
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string
  ) { }
}
