import {
  FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { CustomtextPipe } from '@shared/pipes/customtext/customtext.pipe';
import { AsyncPipe } from '@angular/common';
import { MatFormField, MatInput } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'tc-save-report',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    CustomtextPipe,
    AsyncPipe,
    MatFormField,
    MatInput,
    MatIconButton,
    MatIcon,
    MatButton
  ],
  templateUrl: './save-report.component.html'
})

export class SaveReportComponent {
  savereportform = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3)]),
    key: new FormControl('', [Validators.required, Validators.minLength(3)])
  });

  showPassword: boolean = false;
}
