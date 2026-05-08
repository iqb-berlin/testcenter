import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SysCheckDataService } from '../sys-check-data.service';
import { MatCardModule } from '@angular/material/card';
import { CustomtextPipe } from '@shared/pipes/customtext/customtext.pipe';
import { AsyncPipe, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

@Component({
  templateUrl: './questionnaire.component.html',
  imports: [
    MatCardModule,
    CustomtextPipe,
    AsyncPipe,
    NgIf,
    ReactiveFormsModule,
    NgForOf,
    NgSwitch,
    MatFormField,
    NgSwitchCase,
    MatLabel,
    MatSelect,
    MatOption,
    MatCheckbox,
    MatRadioGroup,
    MatRadioButton,
    MatInput,
    CdkTextareaAutosize,
    NgSwitchDefault
  ],
  styleUrls: ['./questionnaire.component.css', '../sys-check.component.css']
})
export class QuestionnaireComponent implements OnInit, OnDestroy {
  form: FormGroup = new FormGroup([]);
  private readonly valueChangesSubscription: Subscription | null = null;

  constructor(
    public dataservice: SysCheckDataService
  ) {
    const group: { [key: string] : FormControl } = {};
    this.dataservice.checkConfig.questions
      .forEach(question => {
        group[question.id] = new FormControl('');
      });
    this.form = new FormGroup(group);
    this.dataservice.questionnaireReports
      .forEach(reportEntry => {
        this.form.controls[reportEntry.id].setValue(reportEntry.value);
      });
    this.updateReport();
    this.valueChangesSubscription = this.form.valueChanges.subscribe(() => { this.updateReport(); });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.dataservice.setNewCurrentStep('q');
    });
  }

  ngOnDestroy(): void {
    if (this.valueChangesSubscription !== null) {
      this.valueChangesSubscription.unsubscribe();
    }
  }

  private updateReport() {
    this.dataservice.questionnaireReports = [];
    if (this.dataservice.checkConfig) {
      this.dataservice.checkConfig.questions.forEach(element => {
        if (element.type !== 'header') {
          const formControl = this.form.controls[element.id];
          if (formControl) {
            this.dataservice.questionnaireReports.push({
              id: element.id,
              type: element.type,
              label: element.prompt,
              value: formControl.value,
              warning: (['string', 'select', 'radio', 'text', 'check'].indexOf(element.type) > -1) &&
                ((formControl.value === '') || (formControl.value === false)) &&
                (element.required)
            });
          }
        }
      });
    }
  }
}
