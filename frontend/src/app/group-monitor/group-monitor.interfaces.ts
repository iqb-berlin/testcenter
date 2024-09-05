import { TestSessionChange } from 'testcenter-common/interfaces/test-session-change.interface';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../shared/shared.module';

export interface GroupMonitorConfig {
  checkForIdleInterval: number;
}

export type TestSessionData = Readonly<TestSessionChange>;

export interface TestSession {
  readonly data: TestSessionData;
  readonly state: TestSessionSuperState;
  readonly current: UnitContext | null;
  readonly booklet: Booklet | BookletError;
  readonly clearedCodes: Record<string, unknown> | null;
  readonly timeLeft: Record<string, string> | null;
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

export function isBooklet(bookletOrError: Booklet | BookletError): bookletOrError is Booklet {
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
  children: (Unit | Testlet)[];
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

export type TestViewDisplayOptionKey = keyof TestViewDisplayOptions;

// analogous to GroupMonitorProfileFilterField in Testtakers.xsd
export const testSessionFilterTargets = {
  bookletLabel: false,
  personLabel: false,
  state: false,
  blockLabel: false,
  groupName: true,
  bookletName: true,
  blockId: true,
  testState: true,
  mode: true,
  bookletSpecies: true
} as const;

export const testSessionFilterTypes = {
  regex: true,
  substring: false,
  equal: false
} as const;

export type TestSessionFilterType = (keyof typeof testSessionFilterTypes)[number];

export type TestSessionFilterTarget = (keyof typeof testSessionFilterTargets)[number];

export interface TestSessionFilter {
  target: TestSessionFilterTarget;
  value: string | string[];
  id: string;
  label: string;
  subValue?: string;
  type: TestSessionFilterType;
  not?: true;
}

export interface MonitorProfileTestViewDisplayOptions {
  blockColumn: ColumnOption;
  unitColumn: ColumnOption;
  view: ViewOption;
  groupColumn: ColumnOption;
  bookletColumn: ColumnOption;
}

export type ColumnOption = 'show' | 'hide';
export type ViewOption = 'full' | 'medium' | 'small';

export const isColumnOption = (v: string): v is ColumnOption => ['show', 'hide'].includes(v);
export const isViewOption = (v: string): v is ViewOption => ['full', 'medium', 'small'].includes(v);

export interface TestViewDisplayOptions extends MonitorProfileTestViewDisplayOptions {
  highlightSpecies: boolean;
  manualChecking: boolean;
}

export interface Profile {
  id: string;
  label: string;
  settings: { [key: string]: string };
  filtersEnabled: { [key: string]: string };
  filters: TestSessionFilter[];
}

export const testSessionFilterListEntrySources = ['base', 'quick', 'profile', 'custom'] as const;

export type TestSessionFilterListEntrySource = typeof testSessionFilterListEntrySources[number];

export interface TestSessionFilterListEntry {
  filter: TestSessionFilter,
  selected: boolean,
  source: TestSessionFilterListEntrySource
}

export interface TestSessionFilterList {
  [filterId: string]: TestSessionFilterListEntry
}

export interface CheckingOptions {
  enableAutoCheckAll: boolean;
  autoCheckAll: boolean;
}

export function isUnit(testletOrUnit: Testlet | Unit): testletOrUnit is Unit {
  return !('children' in testletOrUnit);
}

export function isTestlet(testletOrUnit: Testlet | Unit): testletOrUnit is Testlet {
  return !isUnit(testletOrUnit);
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
  [bookletName: string]: {
    testIds: number[],
    firstUnitId: string
  }
}
