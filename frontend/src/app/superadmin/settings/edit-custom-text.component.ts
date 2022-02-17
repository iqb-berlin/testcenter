import {
  Component, Input, Output, OnDestroy, OnInit, EventEmitter
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-custom-text',
  template: `
    <div>{{ctKey}}</div>
    <div fxLayout="row" fxLayoutAlign="start start">
      <div fxFlex="40" style="margin: 0 10px 10px 30px">
        <em>{{ctLabel}}</em>
      </div>
      <mat-form-field fxFlex>
        <textarea matInput cdkTextareaAutosize [formControl]="inputControl">
        </textarea>
      </mat-form-field>
      <button mat-button (click)="setToDefault()" matTooltip="Auf Standard setzen"
              [disabled]="inputControl.value === ctDefaultValue">
        <mat-icon>undo</mat-icon>
      </button>
    </div>
    `
})

export class EditCustomTextComponent implements OnInit, OnDestroy {
  @Input() parentForm: FormGroup;
  @Input() ctKey: string;
  @Input() ctLabel: string;
  @Input() ctDefaultValue: string;
  @Input() ctInitialValue: string;
  @Output() valueChange = new EventEmitter<EditCustomTextComponent>();
  inputControl = new FormControl();
  valueChanged = false;
  value: string;
  valueChangeSubscription: Subscription;

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
    this.valueChangeSubscription.unsubscribe();
    this.parentForm.removeControl(this.ctKey);
  }
}
