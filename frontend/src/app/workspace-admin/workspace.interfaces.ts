export const IQBFileTypes = ['Testtakers', 'Booklet', 'SysCheck', 'Resource', 'Unit'] as const;
export type IQBFileType = (typeof IQBFileTypes)[number];

export interface IQBFile {
  name: string;
  size: number;
  modificationTime: string;
  type: IQBFileType;
  isChecked: boolean;
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
