export type BugReportTargetType = 'github';

export interface BugReportTarget {
  type: BugReportTargetType,
}

export interface BugReportTargetGitHub extends BugReportTarget {
  repository: {
    owner: string;
    name: string;
  },
  token: string;
}

export interface BugReportResult {
  uri?: string,
  message: string,
  success: boolean,
}