export interface FileDeletionReport {
  deleted: string[];
  not_allowed: string[];
  did_not_exist: string[];
  was_used: string[];
  incorrect_path: string[];
  error: string[];
}

export interface UploadReport {
  [filename: string]: {
    warning?: string[];
    error?: string[];
    info?: string[];
  }
}

export enum UploadStatus {
  ready,
  busy,
  ok,
  error
}

export interface UploadResponse {
  status: UploadStatus;
  progress: number;
  report: UploadReport;
}
