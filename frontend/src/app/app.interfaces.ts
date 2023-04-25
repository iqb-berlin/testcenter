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

export type AppErrorType = 'session' | 'general' | 'backend' | 'network' | 'warning';

interface AppErrorInterface {
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

export function isAppError(arg: any): arg is AppError {
  return 'label' in arg && 'description' in arg && 'type' in arg;
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
