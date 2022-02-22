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
  globalWarningExpiredHour: string
}

export type AppSettings = AppSettingsObject | Record<string, never>;

export interface SysConfig {
  version: string;
  customTexts: KeyValuePairs;
  appConfig: AppSettings;
  broadcastingService: BroadCastingServiceInfo;
  baseUrl: string;
  veronaPlayerApiVersionMin: number;
  veronaPlayerApiVersionMax: number;
}

export interface BroadCastingServiceInfo {
  status: string;
  version?: string;
  versionExpected?: string;
}

export const localStorageTestConfigKey = 'iqb-tc-c';

export const standardLogo = 'assets/IQB-LogoA.png';
export const standardBackgroundBody = '#003333 linear-gradient(to bottom, #003333, #045659, #0d7b84, #1aa2b2, #2acae5)';
export const standardBackgroundBox = 'lightgray';
