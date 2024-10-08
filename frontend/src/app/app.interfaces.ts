/* eslint-disable max-classes-per-file */
export type AuthFlagType = 'codeRequired';

export type AuthAccessType =
  | 'workspaceAdmin'
  | 'superAdmin'
  | 'test'
  | 'workspaceMonitor'
  | 'testGroupMonitor'
  | 'attachmentManager'
  | 'studyMonitor'
  | 'sysCheck';

export interface AccessObject {
  label: string;
  id: string;
  type: string;
  flags: {
    locked?: boolean;
    running?: boolean;
    scheduled?: number;
    expired?: number;
    profile?: string;
    mode?: 'RW' | 'RO';
    subLabel?: string;
  };
  workspaceId: string;
  description: string;
}

export interface AuthData {
  token: string;
  displayName: string;
  customTexts: KeyValuePairs;
  flags: AuthFlagType[];
  claims: { [key in AuthAccessType]: AccessObject[] };
  groupToken: string | null;
}

export interface KeyValuePairs {
  [K: string]: string;
}

export type AppErrorType =
    'session'
    | 'general'
    | 'backend'
    | 'network'
    | 'script'
    | 'warning'
    | 'fatal'
    | 'network_temporally'
    | 'xml'
    | 'verona_player_runtime_error';

export const TestModeNames = ['prepare', 'api', 'integration', 'prepare-integration'] as const;

export type TestModeName = typeof TestModeNames[number];

export const isTestModeName = (str: string): str is TestModeName => (TestModeNames as readonly string[]).includes(str);

export interface AppErrorInterface {
  label: string;
  description: string;
  type?: AppErrorType;
  code?: number;
  testMode?: TestModeName | null;
  details?: string;
  errorId?: string | null;
}

export class AppError extends Error implements AppErrorInterface {
  label: string = '';
  description: string = '';
  type: AppErrorType = 'general';
  code?: number;
  testMode?: TestModeName | null;
  details?: string;
  errorId?: string;
  constructor(p: AppErrorInterface) {
    super();
    Object.assign(this, p);
  }
}

export class WrappedError extends Error {
  promise: Promise<never> | null = null;
  rejection: Error | null = null;
}

export interface SysCheckInfo {
  workspaceId: string;
  name: string;
  label: string;
  description: string;
}

export type HttpRetryPolicyNames = 'none' | 'test';

export interface HttpRetryPolicy {
  excludedStatusCodes: number[];
  retryPattern: number[];
}

export interface AppModuleSettings {
  httpRetryPolicy: HttpRetryPolicyNames;
  disableGlobalErrorDisplay?: true;
}
