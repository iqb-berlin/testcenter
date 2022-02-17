import { browser, by, element } from 'protractor';

export default class LoginPage {
  static navigateTo(): Promise<void> {
    return browser.get(browser.baseUrl) as Promise<any>;
  }

  static async getFirstCardTitle(): Promise<string> {
    return element(by.css('.root-body mat-card.mat-card:nth-child(1) mat-card-title')).getText();
  }

  static async getSecondCardTitle(): Promise<string> {
    return element(by.css('.root-body mat-card.mat-card:nth-child(2) mat-card-title')).getText();
  }
}
