import { TestSessionChange } from 'testcenter-common/interfaces/test-session-change.interface';
import { BookletDef, TestletDef, UnitDef } from '../shared/shared.module';

export interface GroupMonitorConfig {
  checkForIdleInterval: number;
}

export type TestSessionData = Readonly<TestSessionChange>;

export interface TestSession {
  readonly data: TestSessionData;
  readonly state: TestSessionSuperState;
  readonly current: UnitContext | null;
  readonly booklet: Booklet | BookletError;
  readonly clearedCodes: string[] | null;
  readonly timeLeft: Record<string, number> | null;
  readonly conditionsSatisfied: string[] | null;
}

export const TestSessionsSuperStates = ['monitor_group', 'demo', 'pending', 'locked', 'error',
  'controller_terminated', 'connection_lost', 'paused', 'focus_lost', 'idle',
  'connection_websocket', 'connection_polling', 'ok'] as const;
export type TestSessionSuperState = typeof TestSessionsSuperStates[number];

export type TestViewDisplayOptionKey = keyof TestViewDisplayOptions;

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

export interface UnitContext {
  unit: UnitDef | undefined;
  parent: Testlet;
  ancestor: Testlet;
  indexGlobal: number;
  indexLocal: number;
  indexAncestor: number;
}

export interface Selected {
  element: Testlet | null;
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
  [firstUnitId: string]: number[];
}

export type Unit = UnitDef;

export interface Booklet extends BookletDef<Testlet> {
  species: string;
}

export interface Testlet extends TestletDef<Testlet, Unit> {
  descendantCount: number;
  blockId?: string;
  nextBlockId?: string;
}

export function isUnit(testletOrUnit: Testlet | UnitDef): testletOrUnit is UnitDef {
  return !('children' in testletOrUnit);
}

export function isTestlet(testletOrUnit: Testlet | UnitDef): testletOrUnit is Testlet {
  return !isUnit(testletOrUnit);
}

export function isBooklet(bookletOrError: Booklet | BookletError): bookletOrError is Booklet {
  return bookletOrError && !('error' in bookletOrError);
}

export interface BookletError {
  error: 'xml' | 'missing-id' | 'missing-file' | 'general';
  species: null;
}
