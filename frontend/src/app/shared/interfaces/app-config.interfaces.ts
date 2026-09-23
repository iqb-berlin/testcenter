import { KeyValuePairs } from '../../app.interfaces';

export interface AppSettingsObject {
  appTitle: string,
  privacyNotice: string,
  accessibilityNotice: string,
  legalNoticeHtml: string,
  globalWarningText: string,
  globalWarningExpiredDay: string,
  globalWarningExpiredHour: string,
  themeName: string;
}

export type AppSettings = AppSettingsObject | Record<string, never>;

export interface XmlSchemaVersions {
  [fileType: string]: {
    min: number;
    max: number;
  };
}

export interface SysConfig {
  version: string;
  customTexts: KeyValuePairs;
  appConfig: AppSettings;
  baseUrl: string;
  veronaPlayerApiVersionMin: number;
  veronaPlayerApiVersionMax: number;
  iqbStandardResponseTypeMin: number;
  iqbStandardResponseTypeMax: number;
  xmlSchemaVersions: XmlSchemaVersions;
  bruteForceProtection: string[];
  broadcastingServiceUri: string;
  fileServiceUri: string;
  passwordMinLength: number;
  passwordPattern: string;
}
