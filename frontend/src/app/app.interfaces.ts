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

export interface AppError {
  label: string;
  description: string;
  category: 'WARNING' | 'FATAL' | 'PROBLEM';
}

export class ApiError {
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
