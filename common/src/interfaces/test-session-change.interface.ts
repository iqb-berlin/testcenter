export interface TestSessionChange {
  personId: number;
  groupName: string;
  personLabel: string;
  mode?: string;
  groupLabel?: string;
  testId: number;
  bookletName?: string;
  testState: {
    [testStateKey: string]: string
  };
  testStateKey?: string;
  testStateValue?: string;
  unitName?: string;
  unitState: {
    [unitStateKey: string]: string
  };
  timestamp: number;
}

export function isSessionChange(arg: any): arg is TestSessionChange {
  return (arg.personId !== undefined) && (arg.timestamp !== undefined) && (arg.groupName !== undefined);
}

export function isSessionChangeArray(arg: any): arg is TestSessionChange[] {
  return Array.isArray(arg) && arg.every(isSessionChange);
}
