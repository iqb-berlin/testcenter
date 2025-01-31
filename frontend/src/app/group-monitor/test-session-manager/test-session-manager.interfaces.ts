import { TestSession } from '../group-monitor.interfaces';

export interface TestSessionByDataTestId {
  [testId: number]: TestSession;
}
