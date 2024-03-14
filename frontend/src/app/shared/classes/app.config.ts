import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CustomtextService } from '../services/customtext/customtext.service';
// eslint-disable-next-line import/no-relative-packages
import customTextsDefaultJSON from '../../../../../definitions/custom-texts.json';
import { KeyValuePairs } from '../../app.interfaces';
import {
  AppSettings,
  DEFAULT_BACKGROUND_BODY,
  DEFAULT_BACKGROUND_BOX,
  DEFAULT_LOGO,
  SysConfig
} from '../interfaces/app-config.interfaces';

const customTextsDefault = customTextsDefaultJSON as {
  [k: string]: {
    'label': string,
    'defaultvalue': string
  }
};

export class AppConfig {
  customTexts: KeyValuePairs = {};
  version = '';
  veronaPlayerApiVersionMin: number = 0;
  veronaPlayerApiVersionMax: number = 0;
  mainLogo = DEFAULT_LOGO;
  appTitle = 'IQB-Testcenter';
  backgroundBody: string = '';
  backgroundBox: string = '';
  introHtml = 'Einführungstext nicht definiert';
  trustedIntroHtml: SafeUrl | null = null;
  legalNoticeHtml = 'Impressum/Datenschutz nicht definiert';
  trustedLegalNoticeHtml: SafeUrl | null = null;
  globalWarningText = '';
  globalWarningExpiredDay = '';
  globalWarningExpiredHour = '';
  sanitizer: DomSanitizer | null = null;
  cts: CustomtextService | null = null;
  bugReportAuth: string = '';
  bugReportTarget: string = '';
  broadcastingServiceUri: string = '';
  fileServiceUri: string = '';

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
    sanitizer: DomSanitizer
  ) {
    this.sanitizer = sanitizer;
    this.cts = cts;

    if (sysConfig) {
      this.customTexts = sysConfig.customTexts;
      this.setCustomTexts(sysConfig.customTexts);
      this.setAppConfig(sysConfig.appConfig);
      this.version = sysConfig.version;
      this.veronaPlayerApiVersionMin = sysConfig.veronaPlayerApiVersionMin;
      this.veronaPlayerApiVersionMax = sysConfig.veronaPlayerApiVersionMax;
      this.broadcastingServiceUri = sysConfig.broadcastingServiceUri;
      this.fileServiceUri = sysConfig.fileServiceUri;
    } else {
      this.setCustomTexts({});
      this.setAppConfig({});
    }

    this.applyBackgroundColors();
  }

  setCustomTexts(customTexts: KeyValuePairs): void {
    const ctSettings: { [k: string]: string } = {};
    Object.keys(customTextsDefault).forEach(k => {
      ctSettings[k] = customTextsDefault[k].defaultvalue;
    });
    if (customTexts) {
      Object.keys(customTexts).forEach(k => {
        ctSettings[k] = customTexts[k];
      });
    }
    this.cts?.addCustomTexts(ctSettings);
  }

  setAppConfig(appConfig: AppSettings): void {
    this.appTitle = this.cts?.getCustomText('app_title') ?? 'IQB-Testcenter';
    this.introHtml = this.cts?.getCustomText('app_intro1') ?? 'Einführungstext nicht definiert';
    this.legalNoticeHtml = this.cts?.getCustomText('app_legal_notice') ?? 'Impressum/Datenschutz nicht definiert';
    // TODO does this makes sense
    this.mainLogo = DEFAULT_LOGO;
    this.backgroundBody = DEFAULT_BACKGROUND_BODY;
    this.backgroundBox = DEFAULT_BACKGROUND_BOX;
    this.trustedIntroHtml = null;
    this.trustedLegalNoticeHtml = null;
    this.globalWarningText = '';
    this.globalWarningExpiredDay = '';
    this.globalWarningExpiredHour = '';
    this.bugReportAuth = '';
    this.bugReportTarget = '';
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
      if (appConfig.bugReportAuth) this.bugReportAuth = appConfig.bugReportAuth;
      if (appConfig.bugReportTarget) this.bugReportTarget = appConfig.bugReportTarget;
    }
    this.trustedIntroHtml = this.sanitizer?.bypassSecurityTrustHtml(this.introHtml) ?? '';
    this.trustedLegalNoticeHtml = this.sanitizer?.bypassSecurityTrustHtml(this.legalNoticeHtml) ?? '';
  }

  applyBackgroundColors(): void {
    document.documentElement.style.setProperty('--tc-body-background', this.backgroundBody);
    document.documentElement.style.setProperty('--tc-box-background', this.backgroundBox);
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
      globalWarningExpiredHour: this.globalWarningExpiredHour,
      bugReportAuth: this.bugReportAuth,
      bugReportTarget: this.bugReportTarget
    };
  }
}
