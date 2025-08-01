export const IQBFileTypes = ['Testtakers', 'Booklet', 'SysCheck', 'Unit', 'Resource'] as const;
export type IQBFileType = (typeof IQBFileTypes)[number];

export interface IQBFile {
  name: string;
  size: number;
  modificationTime: string;
  type: IQBFileType;
  isChecked: boolean;
  dependencies: {
    object_name: string;
    relationship_type: string;
  }[];
  report: {
    error: string[];
    warning: string[];
    info: string[];
  },
  info: {
    totalSize?: number;
    testtakers?: number;
    veronaVersion?: string;
    version?: string;
    playerId?: string;
    description?: string;
    label?: string;
  }
}

export type GetFileResponseData = {
  [type in IQBFileType]: IQBFile[]
};

export enum ReportType {
  SYSTEM_CHECK = 'sys-check',
  RESPONSE = 'response',
  LOG = 'log',
  REVIEW = 'review'
}

export interface UnitResponse {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  unitname: string;
  responses: string;
  responsetype: string;
  responses_ts: number;
  laststate: string;
}

export interface ResultData {
  groupName: string;
  groupLabel: string;
  bookletsStarted: number;
  numUnitsMin: number;
  numUnitsMax: number;
  numUnitsAvg: number;
  lastChange: number;
}

export interface LogData {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  unitname: string;
  timestamp: number;
  logentry: string;
}

export interface ReviewData {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  unitname: string;
  priority: number;
  categories: string;
  reviewtime: Date;
  entry: string;
}

export interface SysCheckStatistics {
  id: string;
  label: string;
  count: number;
  details: string[];
}

export type FileResponseDataRelationshipType = 'containsUnit' | 'hasBooklet' | 'isDefinedBy' | 'usesPlayer';

export interface TestSession {
  loginName: string;
  groupName: string;
  groupLabel: string;
  code: string;
  nameSuffix: string;
  bookletName: string;
  bookletLabel: string;
  isChecked?: boolean; // For UI selection state
}

export type TestSessionsResponse = {
  [groupName: string]: TestSession[];
};

export type TestSessionRequest = Pick<TestSession, 'loginName' | 'code' | 'nameSuffix' | 'bookletName'>;
