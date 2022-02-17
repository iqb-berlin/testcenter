import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CustomtextService, MainDataService } from '../../shared/shared.module';
import { BackendService } from '../backend.service';
import allCustomTexts from '../../config/custom-texts.json';
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
  selector: 'app-custom-texts',
  template: `
    <form [formGroup]="customTextsForm" fxFlex fxLayout="column" fxLayoutAlign="start stretch">
      <mat-accordion>
        <mat-expansion-panel *ngFor="let ctGroup of customTextGroups | keyvalue">
          <mat-expansion-panel-header>
            <mat-panel-title>
              {{ctGroup.value.label}}
            </mat-panel-title>
          </mat-expansion-panel-header>
          <app-custom-text *ngFor="let ct of ctGroup.value.texts"
                           [parentForm]="customTextsForm"
                           [ctKey]="ct.key"
                           [ctLabel]="ct.label"
                           [ctDefaultValue]="ct.defaultValue"
                           [ctInitialValue]="ct.value"
                           (valueChange)="valueChanged($event)">
          </app-custom-text>
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

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private mds: MainDataService,
    private bs: BackendService,
    private cts: CustomtextService
  ) {
    this.customTextsForm = new FormGroup({});

    Object.keys(allCustomTexts).forEach(ctKey => {
      const keySplits = ctKey.split('_');
      if (keySplits.length > 1 && this.customTextGroups[keySplits[0]]) {
        this.customTextGroups[keySplits[0]].texts.push({
          key: ctKey,
          label: allCustomTexts[ctKey].label,
          defaultValue: allCustomTexts[ctKey].defaultvalue,
          value: this.mds.appConfig.customTexts[ctKey]
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
    this.bs.setCustomTexts(this.changedData).subscribe(isOk => {
      if (isOk !== false) {
        this.snackBar.open(
          'Textersetzungen gespeichert', 'Info', { duration: 3000 }
        );
        this.dataChanged = false;
        Object.keys(this.changedData).forEach(ctKey => {
          this.mds.appConfig.customTexts[ctKey] = this.changedData[ctKey];
        });
        this.cts.addCustomTexts(this.changedData);
      } else {
        this.snackBar.open('Konnte Textersetzungen nicht speichern', 'Fehler', { duration: 3000 });
      }
    },
    () => {
      this.snackBar.open('Konnte Textersetzungen nicht speichern', 'Fehler', { duration: 3000 });
    });
  }
}
