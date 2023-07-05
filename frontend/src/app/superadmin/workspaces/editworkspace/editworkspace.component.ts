import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { Component, Inject } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
  templateUrl: './editworkspace.component.html',
  styleUrls: ['./editworkspace.component.css']
})
export class EditworkspaceComponent {
  editworkspaceform = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)])
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string
  ) { }
}
