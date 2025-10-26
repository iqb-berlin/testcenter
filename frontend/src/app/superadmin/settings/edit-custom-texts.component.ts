import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CustomtextService, MainDataService, customTextDefaults } from '../../shared/shared.module';
import { BackendService } from '../backend.service';
import { EditCustomTextComponent } from './edit-custom-text.component';
import { AppError, KeyValuePairs } from '../../app.interfaces';
import { AppConfig } from '../../shared/classes/app.config';

export interface CustomTextData {
  key: string,
  label: string,
  defaultValue: string,
  value: string
}

export interface CustomTextDataGroup {
  label: string,
  texts: CustomTextData[]
}

@Component({
    selector: 'tc-custom-texts',
    template: `
    <form [formGroup]="customTextsForm">
      <mat-accordion>
        <mat-expansion-panel *ngFor="let ctGroup of customTextGroups | keyvalue">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <h4>{{ctGroup.value.label}}</h4>
            </mat-panel-title>
          </mat-expansion-panel-header>
          <tc-custom-text *ngFor="let ct of ctGroup.value.texts"
                           [parentForm]="customTextsForm"
                           [ctKey]="ct.key"
                           [ctLabel]="ct.label"
                           [ctDefaultValue]="ct.defaultValue"
                           [ctInitialValue]="ct.value"
                           (valueChange)="valueChanged($event)">
          </tc-custom-text>
          <button mat-raised-button color="primary" [disabled]="!dataChanged" (click)="saveData()">
            Speichern
          </button>
        </mat-expansion-panel>
      </mat-accordion>
    </form>
  `,
    standalone: false
})

export class EditCustomTextsComponent {
  customTextGroups: {
    [key in 'booklet' | 'login' | 'syscheck' | 'gm']: CustomTextDataGroup
  } = {
      booklet: {
        label: 'Testheft',
        texts: []
      },
      login: {
        label: 'Login',
        texts: []
      },
      syscheck: {
        label: 'System-Check',
        texts: []
      },
      gm: {
        label: 'Gruppenmonitor',
        texts: []
      }
    };

  customTextsForm: FormGroup;
  changedData: KeyValuePairs = {};
  dataChanged = false;

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private mainDataService: MainDataService,
    private backendService: BackendService,
    private customtextService: CustomtextService
  ) {
    this.customTextsForm = new FormGroup({});

    Object.keys(customTextDefaults)
      .forEach(ctKey => {
        const keySplits = ctKey.split('_');
        if (!keySplits.length) {
          return;
        }
        const groupKey = keySplits[0];
        if (Object.keys(this.customTextGroups).includes(groupKey)) {
          this.customTextGroups[groupKey as 'booklet' | 'login' | 'syscheck' | 'gm'].texts.push({
            key: ctKey,
            label: customTextDefaults[ctKey].label,
            defaultValue: customTextDefaults[ctKey].defaultvalue,
            value: this.mainDataService.appConfig?.customTexts[ctKey] ?? ''
          });
        }
      });
  }

  valueChanged(editCustomTextComponent: EditCustomTextComponent): void {
    if (editCustomTextComponent.ctInitialValue) {
      if (editCustomTextComponent.value === editCustomTextComponent.ctInitialValue) {
        if (this.changedData[editCustomTextComponent.ctKey]) delete this.changedData[editCustomTextComponent.ctKey];
      } else {
        this.changedData[editCustomTextComponent.ctKey] = editCustomTextComponent.value;
      }
    } else if (editCustomTextComponent.value === editCustomTextComponent.ctDefaultValue) {
      if (this.changedData[editCustomTextComponent.ctKey]) delete this.changedData[editCustomTextComponent.ctKey];
    } else {
      this.changedData[editCustomTextComponent.ctKey] = editCustomTextComponent.value;
    }
    this.dataChanged = Object.keys(this.changedData).length > 0;
  }

  saveData():void {
    this.backendService.setCustomTexts(this.changedData)
      .subscribe(() => {
        if (!this.mainDataService.appConfig) {
          throw new AppError({
            description: '',
            label: 'appConfig not yet loaded',
            type: 'script'
          });
        }
        this.snackBar.open(
          'Textersetzungen gespeichert', 'Info', { duration: 3000 }
        );
        this.dataChanged = false;
        Object.keys(this.changedData).forEach(ctKey => {
          (this.mainDataService.appConfig as AppConfig).customTexts[ctKey] = this.changedData[ctKey];
        });
        this.customtextService.addCustomTexts(this.changedData);
      });
  }
}
