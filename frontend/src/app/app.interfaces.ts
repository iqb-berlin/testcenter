export enum AuthFlagType {
  CODE_REQUIRED = 'codeRequired',
  PENDING = 'pending',
  EXPIRED = 'expired'
}

export enum AuthAccessKeyType {
  WORKSPACE_ADMIN = 'workspaceAdmin',
  SUPER_ADMIN = 'superAdmin',
  TEST = 'test',
  WORKSPACE_MONITOR = 'workspaceMonitor',
  TEST_GROUP_MONITOR = 'testGroupMonitor'
}

export interface AccessType {
  [key: string]: string[];
}

export interface AuthData {
  token: string;
  displayName: string;
  customTexts: KeyValuePairs;
  flags: AuthFlagType[];
  access: AccessType;
}

export interface WorkspaceData {
  id: string;
  name: string;
  role: 'RW' | 'RO' | 'n.d.';
}

export interface AccessObject {
  id: string;
  name: string;
}

export interface BookletData {
  id: string;
  label: string;
  running: boolean;
  locked: boolean;
  xml?: string; // in monitor
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
