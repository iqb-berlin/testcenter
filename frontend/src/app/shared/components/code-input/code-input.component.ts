import {
  Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { CodeInputType } from '@app/app.interfaces';
import { TextFieldFormComponent } from './text-field-form.component';
import { FabFormComponent } from './fab-form/fab-form.component';

@Component({
  selector: 'tc-code-input',
  templateUrl: './code-input.component.html',
  styleUrl: './code-input.component.scss',
  imports: [
    TextFieldFormComponent,
    FabFormComponent
  ]
})
export class CodeInputComponent implements OnChanges {
  @Input() problemText = '';
  @Input() mode: CodeInputType = 'text-field';
  @Input() length: number | undefined; // only used for keypad input
  @Output() submitCode = new EventEmitter<string>();
  @ViewChild(FabFormComponent) fabForm!: FabFormComponent;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.mode !== 'text-field' && changes.problemText) {
      this.fabForm?.clear();
    }
  }

  protected onSubmit(code: string) {
    this.submitCode.emit(code);
  }
}
