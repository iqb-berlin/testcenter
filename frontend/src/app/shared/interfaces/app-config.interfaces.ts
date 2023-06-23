import { KeyValuePairs } from '../../app.interfaces';

export interface AppSettingsObject {
  appTitle: string,
  mainLogo: string,
  backgroundBody: string,
  backgroundBox: string,
  introHtml: string,
  legalNoticeHtml: string,
  globalWarningText: string,
  globalWarningExpiredDay: string,
  globalWarningExpiredHour: string,
  bugReportTarget: string,
  bugReportAuth: string
}

export type AppSettings = AppSettingsObject | Record<string, never>;

export type BroadCastingServiceStatus = 'on' | 'off' | 'unreachable';

export interface SysConfig {
  version: string;
  customTexts: KeyValuePairs;
  appConfig: AppSettings;
  broadcastingService: BroadCastingServiceStatus;
  baseUrl: string;
  veronaPlayerApiVersionMin: number;
  veronaPlayerApiVersionMax: number;
}

export const DEFAULT_LOGO = 'assets/IQB-LogoA.png';
export const DEFAULT_BACKGROUND_BODY = '#003333 linear-gradient(to bottom, #003333, #045659, #0d7b84, #1aa2b2, #2acae5)';
export const DEFAULT_BACKGROUND_BOX = 'lightgray';
