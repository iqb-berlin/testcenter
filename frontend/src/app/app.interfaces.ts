export type AuthFlagType = 'codeRequired';

export type AuthAccessKeyType =
  | 'workspaceAdmin'
  | 'superAdmin'
  | 'test'
  | 'workspaceMonitor'
  | 'testGroupMonitor'
  | 'attachmentManager';

export type AccessObjectFlags = 'locked' | 'running';

export interface AccessObject {
  label: string;
  id: string;
  type: string;
  flags: { [key in AccessObjectFlags]: string | boolean };
}

export interface AuthData {
  token: string;
  displayName: string;
  customTexts: KeyValuePairs;
  flags: AuthFlagType[];
  access: { [key in AuthAccessKeyType]: AccessObject[] };
}

export interface WorkspaceData {
  id: string;
  name: string;
  role: 'RW' | 'RO' | 'n.d.';
}

export interface KeyValuePairs {
  [K: string]: string;
}

export interface AppError {
  label: string;
  description: string;
  category: 'WARNING' | 'ERROR';
}

export class ApiError { // TODO was hat die Klasse hier bei den Interfaces zu suchen?
  code: number;
  info: string;

  constructor(code: number, info = '') {
    this.code = code;
    this.info = info;
  }
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
