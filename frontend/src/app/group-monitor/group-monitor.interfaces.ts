// eslint-disable-next-line import/extensions
import { BookletConfig } from '../config/booklet-config';

export interface TestSession {
  readonly data: TestSessionData;
  readonly state: TestSessionSuperState;
  readonly current: UnitContext|null;
  readonly booklet: Booklet|BookletError;
  readonly clearedCodes: Record<string, unknown>|null;
  readonly timeLeft: Record<string, unknown>|null;
}

export interface TestSessionData {
  readonly personId: number;
  readonly personLabel?: string;
  readonly groupName?: string;
  readonly groupLabel?: string;
  readonly mode?: string;
  readonly testId: number;
  readonly bookletName?: string;
  readonly testState: {
    [testStateKey: string]: string
  };
  readonly unitName?: string;
  readonly unitState: {
    [unitStateKey: string]: string
  };
  readonly timestamp: number;
}

export const TestSessionsSuperStates = ['monitor_group', 'demo', 'pending', 'locked', 'error',
  'controller_terminated', 'connection_lost', 'paused', 'focus_lost', 'idle',
  'connection_websocket', 'connection_polling', 'ok'] as const;
export type TestSessionSuperState = typeof TestSessionsSuperStates[number];

export interface Booklet {
  metadata: BookletMetadata;
  config: BookletConfig;
  restrictions?: Restrictions;
  units: Testlet;
  species: string;
}

export interface BookletError {
  error: 'xml' | 'missing-id' | 'missing-file' | 'general';
  species: null;
}

export function isBooklet(bookletOrError: Booklet|BookletError): bookletOrError is Booklet {
  return bookletOrError && !('error' in bookletOrError);
}

export interface BookletMetadata {
  id: string;
  label: string;
  description: string;
  owner?: string;
  lastchange?: string;
  status?: string;
  project?: string;
}

export interface Testlet {
  id: string;
  label: string;
  restrictions?: Restrictions;
  children: (Unit|Testlet)[];
  descendantCount: number;
  blockId?: string;
  nextBlockId?: string;
}

export interface Unit {
  id: string;
  label: string;
  labelShort: string;
}

export interface Restrictions {
  codeToEnter?: {
    code: string;
    message: string;
  };
  timeMax?: {
    minutes: number
  };
}

export interface GroupData {
  name: string;
  label: string;
}

export type TestViewDisplayOptionKey = 'view' | 'groupColumn';

export interface TestSessionFilter {
  type: 'groupName' | 'bookletName' | 'testState' | 'mode' | 'state' | 'bookletSpecies';
  value: string;
  subValue?: string;
  not?: true;
}

export interface TestViewDisplayOptions {
  blockColumn: 'show' | 'hide';
  unitColumn: 'show' | 'hide';
  view: 'full' | 'medium' | 'small';
  groupColumn: 'show' | 'hide';
  bookletColumn: 'show' | 'hide';
  highlightSpecies: boolean;
  manualChecking: boolean;
}

export interface CheckingOptions {
  enableAutoCheckAll: boolean;
  autoCheckAll: boolean;
}

export function isUnit(testletOrUnit: Testlet|Unit): testletOrUnit is Unit {
  return !('children' in testletOrUnit);
}

export function isTestlet(testletOrUnit: Testlet|Unit): testletOrUnit is Testlet {
  return ('children' in testletOrUnit);
}

export interface UnitContext {
  unit?: Unit;
  parent?: Testlet;
  ancestor?: Testlet;
  indexGlobal: number;
  indexLocal: number;
  indexAncestor: number;
}

export interface Selected {
  element: Testlet|null;
  originSession: TestSession;
  spreading: boolean;
  inversion: boolean;
}

export interface TestSessionSetStats {
  all: boolean;
  number: number;
  differentBooklets: number;
  differentBookletSpecies: number;
  paused: number;
  locked: number;
}

export interface UIMessage {
  level: 'error' | 'warning' | 'info' | 'success';
  text: string;
  customtext: string;
  replacements?: string[]
}

export interface CommandResponse {
  commandType: string;
  testIds: number[];
}

export interface GotoCommandData {
  [bookletName: string]: {
    testIds: number[],
    firstUnitId: string
  }
}
