import { TestSessionChange } from 'testcenter-common/interfaces/test-session-change.interface';
import {
  BookletDef, BookletStateDef, BookletStateOptionDef, TestletDef, UnitDef
} from '../shared/shared.module';

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
  readonly bookletStates: { [state: string]: string } | null;
}

export const TestSessionsSuperStates = ['monitor_group', 'demo', 'pending', 'locked', 'error',
  'controller_terminated', 'connection_lost', 'paused', 'focus_lost', 'idle',
  'connection_websocket', 'connection_polling', 'ok'] as const;
export type TestSessionSuperState = typeof TestSessionsSuperStates[number];

export type TestViewDisplayOptionKey = keyof TestViewDisplayOptions;

// analogous to GroupMonitorProfileFilterField in Testtakers.xsd
export const testSessionFilterTargetLists = {
  advanced: [
    'groupName',
    'bookletId',
    'blockId',
    'testState',
    'mode',
    'bookletSpecies',
    'unitId'
  ],
  basic: [
    'bookletLabel',
    'personLabel',
    'state',
    'blockLabel',
    'unitLabel',
    'bookletStates'
  ]
} as const;

export const testSessionFilterTargets = [
  ...testSessionFilterTargetLists.basic,
  ...testSessionFilterTargetLists.advanced
] as const;

export const testSessionFilterTypeLists = {
  basic: ['substring', 'equal'],
  advanced: ['regex']
} as const;

export const testSessionFilterTypes = [
  ...testSessionFilterTypeLists.basic,
  ...testSessionFilterTypeLists.advanced
] as const;

export type TestSessionFilterType = (typeof testSessionFilterTypes)[number];

export type TestSessionFilterTarget = (typeof testSessionFilterTargets)[number];

export interface TestSessionFilter {
  target: TestSessionFilterTarget;
  value: string | string[];
  id: string;
  label: string;
  subValue?: string;
  type: TestSessionFilterType;
  not: boolean;
}

export const isTestSessionFilter = (obj: object): obj is TestSessionFilter => ('target' in obj) &&
  ('value' in obj) && ('id' in obj) && ('label' in obj) && ('type' in obj) && ('not' in obj) &&
  (typeof obj.type === 'string') && (typeof obj.target === 'string') &&
  (typeof obj.label === 'string') && (typeof obj.not === 'boolean') &&
  (testSessionFilterTypes as readonly string[]).includes(obj.type) &&
  (testSessionFilterTargets as readonly string[]).includes(obj.target);

export const isAdvancedTestSessionFilterTarget =
  (target: TestSessionFilterTarget): boolean => (testSessionFilterTargetLists.advanced)
    .some(t => t === target);

export const isAdvancedTestSessionFilterType =
  (type: TestSessionFilterType): boolean => testSessionFilterTypeLists.advanced
    .some(t => t === type);

export interface MonitorProfileTestViewDisplayOptions {
  blockColumn: ColumnOption;
  unitColumn: ColumnOption;
  view: ViewOption;
  groupColumn: ColumnOption;
  bookletColumn: ColumnOption;
  bookletStatesColumns: string[];
  autoselectNextBlock: boolean;
}

export type ColumnOption = 'show' | 'hide';
export type ViewOption = 'full' | 'medium' | 'small';
export type YesNoOption = 'yes' | 'no';

export const isColumnOption = (v: string): v is ColumnOption => ['show', 'hide'].includes(v);
export const isViewOption = (v: string): v is ViewOption => ['full', 'medium', 'small'].includes(v);
export const isYesNoOption = (v: string): v is YesNoOption => ['yes', 'no'].includes(v);

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
  isBeingDoubleClicked: boolean;
  inversion: boolean;
}

export interface TestSessionSetStats {
  all: boolean;
  number: number;
  differentBooklets: number;
  differentBookletSpecies: number;
  paused: number;
  locked: number;
  bookletStateLabels: { [bookletStateId: string]: string }
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

export interface Booklet extends BookletDef<Testlet, BookletState> {
  species: string;
}

export interface Testlet extends TestletDef<Testlet, Unit> {
  descendantCount: number;
  blockId?: string;
  nextBlockId?: string;
}

export type BookletStateOption = BookletStateOptionDef;
export interface BookletState extends BookletStateDef<BookletStateOption> {
  default: string;
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

export type TestSessionFilterSubValueSelect = BookletStateDef<BookletStateOption>;
