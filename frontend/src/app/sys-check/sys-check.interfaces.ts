export interface SpeedParameters {
  min: number;
  good: number;
  maxDevianceBytesPerSecond: number;
  maxErrorsPerSequence: number;
  maxSequenceRepetitions: number;
  sequenceSizes: number[];
}

export interface CheckConfig {
  name: string;
  label: string;
  questions: FormDefEntry[];
  hasUnit: boolean;
  canSave: boolean;
  customTexts: CustomText[];
  skipNetwork: boolean;
  downloadSpeed: SpeedParameters;
  uploadSpeed: SpeedParameters;
  workspaceId: number;
}

export interface FormDefEntry {
  id: string;
  type: string;
  prompt: string;
  value: string;
  options: string[];
  required: boolean;
}

export interface CustomText {
  key: string;
  value: string;
}

export interface UnitAndPlayerContainer {
  key: string;
  label: string;
  def: string;
  player: string;
  player_id: string;
  duration: number;
}

export interface ServerTime {
  timestamp: number;
  timezone: string;
}

export interface NetworkRequestTestResult {
  'type': 'downloadTest' | 'uploadTest';
  'size': number;
  'duration': number;
  'error': string | null;
  'speedInBPS': number;
}

export interface ReportEntry {
  id: string;
  type: string;
  label: string;
  value: string;
  warning: boolean;
}

export interface NetworkCheckStatus {
  message: string;
  avgUploadSpeedBytesPerSecond: number;
  avgDownloadSpeedBytesPerSecond: number;
  done: boolean;
}

export type TechCheckRating = 'N/A' | 'insufficient' | 'ok' | 'good' | 'unstable';

export interface NetworkRating {
  uploadRating: TechCheckRating;
  downloadRating: TechCheckRating;
  overallRating: TechCheckRating;
}

export interface DetectedNetworkInformation {
  available: boolean;
  downlinkMegabitPerSecond: number | null;
  effectiveNetworkType: string | null;
  roundTripTimeMs: number | null;
  networkType: string | null;
}

export interface SysCheckReport {
  keyPhrase?: string;
  title?: string;
  environment: ReportEntry[];
  network: ReportEntry[];
  questionnaire: ReportEntry[];
  unit: ReportEntry[];
}

export interface StepDef {
  route: string;
  label: string;
}
