import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CustomtextService, MainDataService } from '../../shared/shared.module';
import { BackendService } from '../backend.service';
import allCustomTexts from '../../../../../definitions/custom-texts.json';
import { EditCustomTextComponent } from './edit-custom-text.component';
import { KeyValuePairs } from '../../app.interfaces';

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
  `
})

export class EditCustomTextsComponent {
  customTextGroups = {
    booklet: <CustomTextDataGroup>{
      label: 'Testheft',
      texts: []
    },
    login: <CustomTextDataGroup>{
      label: 'Login',
      texts: []
    },
    syscheck: <CustomTextDataGroup>{
      label: 'System-Check',
      texts: []
    },
    gm: <CustomTextDataGroup>{
      label: 'Gruppenmonitor',
      texts: []
    }
  };

  customTextsForm: FormGroup;
  changedData: KeyValuePairs = {};
  dataChanged = false;

  constructor(private formBuilder: FormBuilder,
              private snackBar: MatSnackBar,
              private mainDataService: MainDataService,
              private backendService: BackendService,
              private customtextService: CustomtextService) {
    this.customTextsForm = new FormGroup({});

    Object.keys(allCustomTexts).forEach(ctKey => {
      const keySplits = ctKey.split('_');
      if (keySplits.length > 1 && this.customTextGroups[keySplits[0]]) {
        this.customTextGroups[keySplits[0]].texts.push({
          key: ctKey,
          label: allCustomTexts[ctKey].label,
          defaultValue: allCustomTexts[ctKey].defaultvalue,
          value: this.mainDataService.appConfig.customTexts[ctKey]
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
    this.backendService.setCustomTexts(this.changedData).subscribe(isOk => {
      if (isOk !== false) {
        this.snackBar.open(
          'Textersetzungen gespeichert', 'Info', { duration: 3000 }
        );
        this.dataChanged = false;
        Object.keys(this.changedData).forEach(ctKey => {
          this.mainDataService.appConfig.customTexts[ctKey] = this.changedData[ctKey];
        });
        this.customtextService.addCustomTexts(this.changedData);
      } else {
        this.snackBar.open('Konnte Textersetzungen nicht speichern', 'Fehler', { duration: 3000 });
      }
    },
    () => {
      this.snackBar.open('Konnte Textersetzungen nicht speichern', 'Fehler', { duration: 3000 });
    });
  }
}
