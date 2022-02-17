import { KeyValuePairs } from '../../app.interfaces';

export interface AppSettings {
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

export interface SysConfig {
  customTexts: KeyValuePairs;
  version: string;
  mainLogo: string;
  testConfig: KeyValuePairs;
  serverTimestamp: number;
  broadcastingService: BroadCastingServiceInfo;
  appConfig: AppSettings;
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
