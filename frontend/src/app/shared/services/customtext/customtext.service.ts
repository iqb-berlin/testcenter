import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscribable } from 'rxjs';
import { CustomTextDefs } from '../../interfaces/customtext.interfaces';

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

  // this function gets called the first time when Observable is not available, so we just return a Subscribable
  getCustomText$(key: string): Subscribable<string> {
    if (typeof this.customTexts[key] === 'undefined') {
      this.customTexts[key] = new BehaviorSubject<string>(null);
    }
    return this.customTexts[key];
  }

  getCustomText(key: string): string {
    if (typeof this.customTexts[key] === 'undefined') {
      return null;
    }
    return this.customTexts[key].getValue();
  }
}
