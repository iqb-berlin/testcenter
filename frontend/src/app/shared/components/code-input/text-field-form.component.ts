import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MatFormField, MatInput, MatLabel, MatSuffix
} from '@angular/material/input';
import {
  FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';

@Component({
  selector: 'tc-code-text-field-form',
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    ReactiveFormsModule,
    MatIcon,
    MatLabel,
    MatIconButton,
    MatSuffix
  ],
  template: `
    <div class="header-section">
      <ng-content></ng-content>
    </div>
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
        {{ buttonLabel }}
      </button>
    </form>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    form button {
      align-self: start;
    }
  `
})
export class TextFieldFormComponent {
  @Input() buttonLabel: string = 'Anmelden';
  @Output() submitCode = new EventEmitter<string>();

  codeinputform = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    })
  });

  protected clearInput() {
    this.codeinputform.get('code')?.setValue('');
  }
}
