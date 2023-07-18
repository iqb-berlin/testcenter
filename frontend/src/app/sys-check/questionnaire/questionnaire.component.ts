import { FormControl, FormGroup } from '@angular/forms';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SysCheckDataService } from '../sys-check-data.service';

@Component({
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.css', '../sys-check.component.css']
})
export class QuestionnaireComponent implements OnInit, OnDestroy {
  form: FormGroup = new FormGroup([]);
  private readonly valueChangesSubscription: Subscription | null = null;

  constructor(
    public ds: SysCheckDataService
  ) {
    const group: { [key: string] : FormControl } = {};
    this.ds.checkConfig.questions
      .forEach(question => {
        group[question.id] = new FormControl('');
      });
    this.form = new FormGroup(group);
    this.ds.questionnaireReport
      .forEach(reportEntry => {
        this.form.controls[reportEntry.id].setValue(reportEntry.value);
      });
    this.valueChangesSubscription = this.form.valueChanges.subscribe(() => { this.updateReport(); });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.ds.setNewCurrentStep('q');
    });
  }

  ngOnDestroy(): void {
    if (this.valueChangesSubscription !== null) {
      this.valueChangesSubscription.unsubscribe();
    }
  }

  private updateReport() {
    this.ds.questionnaireReport = [];
    if (this.ds.checkConfig) {
      this.ds.checkConfig.questions.forEach(element => {
        if (element.type !== 'header') {
          const formControl = this.form.controls[element.id];
          if (formControl) {
            this.ds.questionnaireReport.push({
              id: element.id,
              type: element.type,
              label: element.prompt,
              value: formControl.value,
              // eslint-disable-next-line max-len
              warning: (['string', 'select', 'radio', 'text'].indexOf(element.type) > -1) && (formControl.value === '') && (element.required)
            });
          }
        }
      });
    }
  }
}
