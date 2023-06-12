export type AuthFlagType = 'codeRequired';

export type AuthAccessType =
  | 'workspaceAdmin'
  | 'superAdmin'
  | 'test'
  | 'workspaceMonitor'
  | 'testGroupMonitor'
  | 'attachmentManager';

export interface AccessObject {
  label: string;
  id: string;
  type: string;
  flags: {
    locked?: boolean;
    running?: boolean;
    scheduled?: number;
    expired?: number;
    mode: 'RW' | 'RO'
  };
}

export interface AuthData {
  token: string;
  displayName: string;
  customTexts: KeyValuePairs;
  flags: AuthFlagType[];
  claims: { [key in AuthAccessType]: AccessObject[] };
}

export interface KeyValuePairs {
  [K: string]: string;
}

export type AppErrorType = 'session' | 'general' | 'backend' | 'network' | 'script' | 'fatal' | 'network_temporally';

export interface AppErrorInterface {
  label: string;
  description: string;
  type?: AppErrorType;
  code?: number;
  details?: string;
  errorId?: string;
}

export class AppError extends Error implements AppErrorInterface {
  label: string;
  description: string;
  type: AppErrorType = 'general';
  code?: number;
  details?: string;
  errorId?: string;
  constructor(p: AppErrorInterface) {
    super();
    Object.assign(this, p);
  }
}

export class WrappedError extends Error {
  promise: Promise<any>;
  rejection: Error;
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
