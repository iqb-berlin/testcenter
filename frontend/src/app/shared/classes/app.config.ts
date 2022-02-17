import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CustomtextService } from '../services/customtext/customtext.service';
import customTextsDefault from '../../config/custom-texts.json';
import { KeyValuePairs } from '../../app.interfaces';
import {
  AppSettings,
  BroadCastingServiceInfo,
  localStorageTestConfigKey, standardBackgroundBody, standardBackgroundBox,
  standardLogo,
  SysConfig
} from '../interfaces/app-config.interfaces';

export class AppConfig {
  customTexts: KeyValuePairs = {};
  detectedApiVersion = '';
  mainLogo = standardLogo;
  testConfig: KeyValuePairs = {};
  serverTimestamp = 0;
  broadcastingService: BroadCastingServiceInfo = { status: 'none' };
  appTitle = 'IQB-Testcenter';
  backgroundBody: string;
  backgroundBox: string;
  introHtml = 'Einführungstext nicht definiert';
  trustedIntroHtml: SafeUrl = null;
  legalNoticeHtml = 'Impressum/Datenschutz nicht definiert';
  trustedLegalNoticeHtml: SafeUrl = null;
  globalWarningText = '';
  globalWarningExpiredDay = '';
  globalWarningExpiredHour = '';
  isValidApiVersion = false;
  sanitizer: DomSanitizer = null;
  cts: CustomtextService = null;

  get warningMessage(): string {
    if (this.globalWarningExpiredDay) {
      return AppConfig.isWarningExpired(this.globalWarningExpiredDay, this.globalWarningExpiredHour) ?
        '' : this.globalWarningText;
    }
    return this.globalWarningText;
  }

  constructor(
    sysConfig: SysConfig,
    cts: CustomtextService,
    expectedApiVersion: string,
    sanitizer: DomSanitizer
  ) {
    this.sanitizer = sanitizer;
    this.cts = cts;

    if (sysConfig) {
      this.customTexts = sysConfig.customTexts;
      this.setCustomTexts(sysConfig.customTexts);
      this.setAppConfig(sysConfig.appConfig);
      this.testConfig = sysConfig.testConfig;
      this.serverTimestamp = sysConfig.serverTimestamp;
      if (sysConfig.broadcastingService && sysConfig.broadcastingService.status) {
        this.broadcastingService = sysConfig.broadcastingService;
      }
      this.detectedApiVersion = sysConfig.version;
    } else {
      this.setCustomTexts(null);
      this.setAppConfig(null);
    }
    this.isValidApiVersion = AppConfig.checkApiVersion(this.detectedApiVersion, expectedApiVersion);
    if (this.testConfig) {
      localStorage.setItem(localStorageTestConfigKey, JSON.stringify(this.testConfig));
    } else {
      localStorage.removeItem(localStorageTestConfigKey);
    }
    this.applyBackgroundColors();
  }

  setCustomTexts(customTexts: KeyValuePairs): void {
    const ctSettings = {};
    Object.keys(customTextsDefault).forEach(k => {
      ctSettings[k] = customTextsDefault[k].defaultvalue;
    });
    if (customTexts) {
      Object.keys(customTexts).forEach(k => {
        ctSettings[k] = customTexts[k];
      });
    }
    this.cts.addCustomTexts(ctSettings);
  }

  setAppConfig(appConfig: AppSettings): void {
    this.appTitle = this.cts.getCustomText('app_title');
    if (!this.appTitle) this.appTitle = 'IQB-Testcenter';
    this.introHtml = this.cts.getCustomText('app_intro1');
    if (this.introHtml) {
      this.legalNoticeHtml = this.introHtml;
    } else {
      this.introHtml = 'Einführungstext nicht definiert';
      this.legalNoticeHtml = 'Impressum/Datenschutz nicht definiert';
    }
    this.mainLogo = standardLogo;
    this.backgroundBody = standardBackgroundBody;
    this.backgroundBox = standardBackgroundBox;
    this.trustedIntroHtml = null;
    this.trustedLegalNoticeHtml = null;
    this.globalWarningText = '';
    this.globalWarningExpiredDay = '';
    this.globalWarningExpiredHour = '';
    if (appConfig) {
      if (appConfig.appTitle) this.appTitle = appConfig.appTitle;
      if (appConfig.mainLogo) this.mainLogo = appConfig.mainLogo;
      if (appConfig.backgroundBody) this.backgroundBody = appConfig.backgroundBody;
      if (appConfig.backgroundBox) this.backgroundBox = appConfig.backgroundBox;
      if (appConfig.introHtml) this.introHtml = appConfig.introHtml;
      if (appConfig.legalNoticeHtml) this.legalNoticeHtml = appConfig.legalNoticeHtml;
      if (appConfig.globalWarningText) this.globalWarningText = appConfig.globalWarningText;
      if (appConfig.globalWarningExpiredDay) this.globalWarningExpiredDay = appConfig.globalWarningExpiredDay;
      if (appConfig.globalWarningExpiredHour) {
        this.globalWarningExpiredHour = appConfig.globalWarningExpiredHour;
      }
    }
    this.trustedIntroHtml = this.sanitizer.bypassSecurityTrustHtml(this.introHtml);
    this.trustedLegalNoticeHtml = this.sanitizer.bypassSecurityTrustHtml(this.legalNoticeHtml);
  }

  applyBackgroundColors(): void {
    document.documentElement.style.setProperty('--tc-body-background', this.backgroundBody);
    document.documentElement.style.setProperty('--tc-box-background', this.backgroundBox);
  }

  private static checkApiVersion(versionToCheck: string, expectedVersion: string): boolean {
    if (!expectedVersion || !versionToCheck) {
      return false;
    }
    const searchPattern = /\d+/g;
    const expectedVersionNumbers = expectedVersion.match(searchPattern);
    const reportedVersionNumbers = versionToCheck.match(searchPattern);
    if (expectedVersionNumbers && reportedVersionNumbers) {
      if (reportedVersionNumbers[0] !== expectedVersionNumbers[0]) {
        return false;
      }
      if (expectedVersionNumbers.length > 1) {
        if ((reportedVersionNumbers.length < 2) || +reportedVersionNumbers[1] < +expectedVersionNumbers[1]) {
          return false;
        }
        if ((expectedVersionNumbers.length > 2) && reportedVersionNumbers[1] === expectedVersionNumbers[1]) {
          if ((reportedVersionNumbers.length < 3) || +reportedVersionNumbers[2] < +expectedVersionNumbers[2]) {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  }

  static isWarningExpired(warningDay: string, warningHour: string): boolean {
    const calcTimePoint = new Date(warningDay);
    calcTimePoint.setHours(Number(warningHour));
    const now = new Date(Date.now());
    return calcTimePoint < now;
  }

  getAppConfig(): AppSettings {
    return {
      appTitle: this.appTitle,
      mainLogo: this.mainLogo,
      backgroundBody: this.backgroundBody,
      backgroundBox: this.backgroundBox,
      introHtml: this.introHtml,
      legalNoticeHtml: this.legalNoticeHtml,
      globalWarningText: this.globalWarningText,
      globalWarningExpiredDay: this.globalWarningExpiredDay,
      globalWarningExpiredHour: this.globalWarningExpiredHour
    };
  }
}
