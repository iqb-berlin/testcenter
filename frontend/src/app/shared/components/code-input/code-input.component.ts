import {
  Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { CustomtextPipe } from '@shared/pipes/customtext/customtext.pipe';
import { CodeInputType } from '@app/app.interfaces';
import { AssetService } from '@shared/services/asset.service';
import { TextFieldFormComponent } from './text-field-form.component';
import { FabFormComponent } from './fab-form/fab-form.component';

@Component({
  selector: 'tc-code-input',
  templateUrl: './code-input.component.html',
  styleUrl: './code-input.component.scss',
  imports: [
    TextFieldFormComponent,
    FabFormComponent,
    NgTemplateOutlet
  ]
})
export class CodeInputComponent implements OnInit, OnChanges {
  @Input() problemText = '';
  @Input() inputType: CodeInputType = 'text-field';
  @Input() length: number | undefined; // only used for keypad input
  @Input() buttonLabel: string = 'Anmelden';
  @Input() speechBubbleText: { heading?: string, body?: string } = {
    heading: 'Brauchst du Hilfe?',
    body: 'Deine Lehrerin oder dein Lehrer hilft dir weiter.\n' +
          'Melde dich bei ihm/ihr oder klicke auf mich drauf!'
  };

  @Output() submitCode = new EventEmitter<string>();
  @ViewChild(FabFormComponent) fabForm!: FabFormComponent;
  protected companionImageSrc?: string;

  constructor(protected assetService: AssetService) { }

  ngOnInit() {
    this.companionImageSrc = this.assetService.getAssetSrc('codeInputCompanion');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.inputType !== 'text-field' && changes.problemText) {
      this.fabForm?.clear();
    }
  }

  protected onSubmit(code: string) {
    this.submitCode.emit(code);
  }
}
