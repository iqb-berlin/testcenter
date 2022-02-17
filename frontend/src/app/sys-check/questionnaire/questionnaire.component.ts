import { FormControl, FormGroup } from '@angular/forms';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SysCheckDataService } from '../sys-check-data.service';

@Component({
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.css', '../sys-check.component.css']
})
export class QuestionnaireComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private valueChangesSubscription: Subscription = null;

  constructor(
    public ds: SysCheckDataService
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.ds.setNewCurrentStep('q');
      const group = {};
      if (this.ds.checkConfig) {
        this.ds.checkConfig.questions.forEach(question => {
          group[question.id] = new FormControl('');
        });
        this.form = new FormGroup(group);
        this.ds.questionnaireReport.forEach(reportEntry => {
          const formControl = this.form.controls[reportEntry.id];
          if (formControl) {
            formControl.setValue(reportEntry.value);
          }
        });
        this.valueChangesSubscription = this.form.valueChanges.subscribe(() => { this.updateReport(); });
      }
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
