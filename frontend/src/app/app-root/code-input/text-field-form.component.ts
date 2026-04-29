import { Component, EventEmitter, Output } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MatFormField, MatInput, MatLabel, MatSuffix
} from '@angular/material/input';
import {
  FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { CustomtextPipe, SharedModule } from '@shared/shared.module';

@Component({
  selector: 'tc-code-text-field-form',
  imports: [
    AsyncPipe,
    MatButton,
    MatFormField,
    MatInput,
    ReactiveFormsModule,
    SharedModule,
    MatIcon,
    MatLabel,
    MatIconButton,
    MatSuffix,
    CustomtextPipe
  ],
  template: `
    <h2>{{ 'login_codeInputTitle' | customtext:'login_codeInputTitle' | async }}</h2>
    <form [formGroup]="codeinputform" (ngSubmit)="submitCode.emit(codeinputform.value.code)">
      <mat-form-field appearance="outline">
        <mat-label>Code</mat-label>
        <input matInput formControlName="code">
        @if (codeinputform.get('code')?.value) {
          <button type="button" matIconButton matSuffix (click)="clearInput()">
            <mat-icon svgIcon="cancel"></mat-icon>
          </button>
        }
      </mat-form-field>
      <button type="submit" matButton="filled" [disabled]="codeinputform.invalid" data-cy="continue">
        <mat-icon svgIcon="keyboard_arrow_right"></mat-icon>
        Anmelden
      </button>
    </form>

  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
    }

    form button {
      align-self: start;
    }
  `
})
export class TextFieldFormComponent {
  @Output() submitCode = new EventEmitter<string | null>();

  codeinputform = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(2)])
  });

  protected clearInput() {
    this.codeinputform.get('code')?.setValue('');
  }
}
