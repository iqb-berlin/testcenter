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

export interface StarterButton {
  title: string;
  status: string;
  disabled: boolean;
  accessObject: AccessObject;
}
