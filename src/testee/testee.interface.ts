export interface Testee {
  token: string;
  testId: number;
  disconnectNotificationUri: string;
}

export function isTestee(arg: any): arg is Testee {
  return (arg.token !== undefined) && (arg.testId !== undefined);
}
