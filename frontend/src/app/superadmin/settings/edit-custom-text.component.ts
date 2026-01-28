import {
  Component, Input, Output, OnDestroy, OnInit, EventEmitter
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatFormField, MatInput } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/list';

@Component({
  selector: 'tc-custom-text',
  imports: [
    MatFormField,
    MatInput,
    CdkTextareaAutosize,
    ReactiveFormsModule,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatDivider
  ],
  template: `
    <div class="flex-row" [style.align-items]="'center'" [style.margin-bottom.px]="10">
      <div class="flex-column" [style.width.%]="40">
        <p>{{ ctLabel }}</p>
        <em [style.font-size]="'smaller'">({{ ctKey }})</em>
      </div>
      <mat-form-field [style.width.%]="50">
      <textarea matInput cdkTextareaAutosize [formControl]="inputControl">
      </textarea>
      </mat-form-field>
      <button mat-icon-button matTooltip="Auf Standard setzen"
              [style.width.%]="10"
              [disabled]="inputControl.value === ctDefaultValue"
              (click)="setToDefault()">
        <mat-icon>undo</mat-icon>
      </button>
    </div>
    <mat-divider></mat-divider>
  `
})

export class EditCustomTextComponent implements OnInit, OnDestroy {
  @Input() parentForm!: FormGroup;
  @Input() ctKey!: string;
  @Input() ctLabel!: string;
  @Input() ctDefaultValue!: string;
  @Input() ctInitialValue!: string;
  @Output() valueChange = new EventEmitter<EditCustomTextComponent>();
  inputControl = new FormControl();
  valueChanged = false;
  value: string = '';
  valueChangeSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.inputControl.setValue(this.ctInitialValue ? this.ctInitialValue : this.ctDefaultValue);
    this.parentForm.addControl(this.ctKey, this.inputControl);
    this.valueChangeSubscription = this.inputControl.valueChanges.subscribe(() => {
      this.value = this.inputControl.value;
      if (!this.value) {
        this.inputControl.setValue(this.ctDefaultValue, { emitEvent: false });
        this.value = this.ctDefaultValue;
      }
      this.valueChanged = this.ctInitialValue ?
        (this.value !== this.ctInitialValue) : (this.value !== this.ctDefaultValue);
      this.valueChange.emit(this);
    });
  }

  setToDefault(): void {
    this.inputControl.setValue(this.ctDefaultValue);
  }

  ngOnDestroy(): void {
    this.valueChangeSubscription?.unsubscribe();
    this.parentForm.removeControl(this.ctKey);
  }
}
