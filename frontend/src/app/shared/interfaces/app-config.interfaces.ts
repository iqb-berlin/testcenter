import { KeyValuePairs } from '../../app.interfaces';

export interface AppSettingsObject {
  appTitle: string,
  privacyNotice: string,
  accessibilityNotice: string,
  legalNoticeHtml: string,
  globalWarningText: string,
  globalWarningExpiredDay: string,
  globalWarningExpiredHour: string,
  bugReportTarget: string,
  bugReportAuth: string
  themeName: string;
}

export type AppSettings = AppSettingsObject | Record<string, never>;

export interface SysConfig {
  version: string;
  customTexts: KeyValuePairs;
  appConfig: AppSettings;
  baseUrl: string;
  veronaPlayerApiVersionMin: number;
  veronaPlayerApiVersionMax: number;
  iqbStandardResponseTypeMin: number;
  iqbStandardResponseTypeMax: number;
  bruteForceProtection: string[];
  broadcastingServiceUri: string;
  fileServiceUri: string;
}
