import { KeyValuePairs } from '../../app.interfaces';
import { CustomImages } from './custom-images.interface';

export interface AppSettingsObject {
  appTitle: string,
  mainLogo: string,
  introHtml: string,
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
  customImages: Record<keyof CustomImages, string>
  appConfig: AppSettings;
  baseUrl: string;
  veronaPlayerApiVersionMin: number;
  veronaPlayerApiVersionMax: number;
  iqbStandardResponseTypeMin: number;
  iqbStandardResponseTypeMax: number;
  broadcastingServiceUri: string;
  fileServiceUri: string;
}

export const DEFAULT_LOGO = 'assets/IQB-LogoA.png';