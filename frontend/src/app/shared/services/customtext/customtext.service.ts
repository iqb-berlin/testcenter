import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CustomTextDefs } from '../../interfaces/customtext.interfaces';
import customTextsDefault from '../../../../../../definitions/custom-texts.json';

@Injectable({
  providedIn: 'root'
})
export class CustomtextService {
  private customTexts: { [key: string]: BehaviorSubject<string> } = {};

  addCustomTexts(newTexts: { [key: string]: string }): void {
    Object.keys(newTexts).forEach(key => {
      this.addCustomText(key, newTexts[key]);
    });
  }

  addCustomTextsFromDefs(newTexts: CustomTextDefs): void {
    Object.keys(newTexts).forEach(key => {
      this.addCustomText(key, newTexts[key].defaultvalue);
    });
  }

  private addCustomText(key: string, value: string): void {
    if (typeof this.customTexts[key] === 'undefined') {
      this.customTexts[key] = new BehaviorSubject<string>(null);
    }
    this.customTexts[key].next(value);
  }

  getCustomText$(key: string): BehaviorSubject<string> {
    if (typeof this.customTexts[key] === 'undefined') {
      this.customTexts[key] = new BehaviorSubject<string>(null);
    }
    return this.customTexts[key];
  }

  restoreDefault(all: boolean): void {
    if (typeof this.customTexts === 'undefined') {
      return;
    }

    Object.keys(this.customTexts).forEach(k => {
      if (this.customTexts[k] && customTextsDefault[k]) {
        this.customTexts[k].next(customTextsDefault[k].defaultvalue);
      }
      if (all === true) {
        if (!(k in customTextsDefault) && this.customTexts[k]) {
          this.customTexts[k] = new BehaviorSubject<string>(null);
        }
      }
    });
  }

  getCustomText(key: string): string {
    if (typeof this.customTexts[key] === 'undefined') {
      return null;
    }
    return this.customTexts[key].getValue();
  }
}
