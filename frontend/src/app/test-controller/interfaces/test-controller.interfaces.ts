import { Observable } from 'rxjs';
import { CodingScheme } from '@iqb/responses';
import {
  BookletDef,
  BookletStateDef,
  BookletStateOptionDef,
  TestletDef,
  UnitDef
} from '../../shared/interfaces/booklet.interfaces';
import { IQBVariable } from './iqb.interfaces';
import { VeronaNavigationTarget, VeronaProgress } from './verona.interfaces';

export type LoadingQueueEntryTypeType = 'definition' | 'scheme';

export interface LoadingQueueEntry {
  sequenceId: number;
  file: string;
  type: LoadingQueueEntryTypeType
}

export interface KeyValuePairString {
  [K: string]: string;
}

export type WindowFocusState =
  | 'PLAYER'
  | 'HOST'
  | 'UNKNOWN';

export type UnitData = {
  dataParts: KeyValuePairString;
  unitResponseType: string;
  state: UnitState;
  definition : string;
  definitionType: string;
};

export type TestFileRelationshipType = 'usesPlayerResource' | 'isDefinedBy' | 'usesPlayer' | 'usesScheme';

export interface TestDataResourcesMap {
  [unitId: string]: {
    [relationshipType in TestFileRelationshipType]? : string[]
  }
}

export interface TestData {
  xml: string;
  mode: string;
  laststate: { [k in TestStateKey]?: string };
  resources: TestDataResourcesMap;
  firstStart: boolean;
  workspaceId: number;
}

export type TestControllerState =
  | 'INIT'
  | 'LOADING'
  | 'RUNNING'
  | 'TERMINATED'
  | 'TERMINATED_PAUSED'
  | 'PAUSED'
  | 'ERROR';

export type AppFocusState =
  | 'HAS'
  | 'HAS_NOT';

export type TestStateConnectionValue =
  | 'WEBSOCKET'
  | 'POLLING';

export type TestLogEntryKey =
  | 'LOADCOMPLETE';

export type UnitPlayerState =
  | 'LOADING'
  | 'RUNNING';

export type TestState = {
  CURRENT_UNIT_ID: string;
  TESTLETS_TIMELEFT: string;
  TESTLETS_CLEARED_CODE: string;
  TESTLETS_LOCKED_AFTER_LEAVE: string;
  BOOKLET_STATES: { [state: string]: string };
  UNITS_LOCKED_AFTER_LEAVE: string;
  FOCUS: AppFocusState;
  CONTROLLER: UnitPlayerState;
  CONNECTION: TestStateConnectionValue;
};

export type UnitState = {
  PRESENTATION_PROGRESS?: VeronaProgress;
  RESPONSE_PROGRESS?: VeronaProgress;
  CURRENT_PAGE_ID?: string;
  CURRENT_PAGE_NR?: number;
  PAGE_COUNT?: number;
  PLAYER?: string;
};

export type TestStateKey = keyof TestState;

export type UnitStateKey =
  | 'PRESENTATION_PROGRESS'
  | 'RESPONSE_PROGRESS'
  | 'CURRENT_PAGE_ID'
  | 'CURRENT_PAGE_NR'
  | 'PAGE_COUNT'
  | 'PLAYER';

export interface UnitDataParts {
  testId: string;
  unitAlias: string;
  dataParts: KeyValuePairString;
  unitStateDataType: string;
}

export interface StateReportEntry<StateType extends string> {
  key: StateType
  timeStamp: number;
  content: string;
}

export interface StateUpdate<StateType extends string> {
  state: StateReportEntry<StateType>[];
  testId: string;
  unitAlias: string;
}

export type UnitStateUpdate = StateUpdate<UnitStateKey>;
export type TestStateUpdate = StateUpdate<TestStateKey>;

export enum MaxTimerEvent {
  STARTED = 'STARTED',
  STEP = 'STEP',
  CANCELLED = 'CANCELLED',
  INTERRUPTED = 'INTERRUPTED',
  ENDED = 'ENDED'
}

export interface ReviewDialogData {
  loginname: string;
  bookletname: string;
  unitAlias: string;
  unitTitle: string;
}

export interface KeyValuePairNumber {
  [K: string]: number;
}

export enum UnitNavigationTarget {
  NEXT = '#next',
  ERROR = '#error',
  PREVIOUS = '#previous',
  FIRST = '#first',
  LAST = '#last',
  END = '#end',
  PAUSE = '#pause'
}

export const commandKeywords = [
  'pause',
  'goto',
  'terminate',
  'resume',
  'debug'
];
export type CommandKeyword = (typeof commandKeywords)[number];
export function isKnownCommand(keyword: string): keyword is CommandKeyword {
  return (commandKeywords as readonly string[]).includes(keyword);
}

export interface Command {
  keyword: CommandKeyword;
  id: number; // a unique id for each command, to make sure each one get only performed once (even in polling mode)
  arguments: string[];
  timestamp: number;
}

export type NavigationLeaveRestrictionValue = 'ON' | 'OFF' | 'ALWAYS';
export function isNavigationLeaveRestrictionValue(s: string): s is NavigationLeaveRestrictionValue {
  return ['ON', 'OFF', 'ALWAYS'].includes(s);
}

export interface LoadingProgress {
  progress: number | 'UNKNOWN' | 'PENDING';
}

export interface LoadedFile {
  content: string;
}

export type LoadingFile = LoadingProgress | LoadedFile;

export function isLoadingFileLoaded(loadingFile: LoadingFile): loadingFile is LoadedFile {
  return 'content' in loadingFile;
}

export interface Unit extends UnitDef {
  readonly sequenceId: number;
  readonly parent: Testlet;
  readonly localIndex: number;
  unitDefinitionType: string;
  variables: { [variableId: string]: IQBVariable };
  baseVariableIds: string[];
  playerFileName: string;
  scheme: CodingScheme;
  responseType: string | undefined;
  definition: string;
  state: UnitState;
  dataParts: KeyValuePairString; // in never versions of verona dataParts is part of state.
  // Since we have to handle both differently, we keep it separated here. Maybe this will change in the future.
  loadingProgress: { [resourceId in LoadingQueueEntryTypeType]?: Observable<LoadingProgress> };
  lockedAfterLeaving: boolean;
}

export const TestletLockTypes = ['show', 'time', 'code', 'afterLeave'] as const;

export type TestletLockType = typeof TestletLockTypes[number];

export interface Testlet extends TestletDef<Testlet, Unit> {
  readonly blockLabel: string;
  locks: Required<{ [ type in TestletLockType ]: boolean }>
  locked: {
    by: TestletLockType;
    through: Testlet;
  } | null;
  timerId: string | null;

}

export interface BookletStateOption extends BookletStateOptionDef {
  firstUnsatisfiedCondition: number;
}

export interface BookletState extends BookletStateDef<BookletStateOption> {
  override: string | undefined;
  current: string;
  default: string;
}

export type Booklet = BookletDef<Testlet, BookletState>;

export function isUnit(testletOrUnit: Testlet | Unit): testletOrUnit is Unit {
  return !('children' in testletOrUnit);
}

export function isTestlet(testletOrUnit: Testlet | Unit): testletOrUnit is Testlet {
  return !isUnit(testletOrUnit);
}

export type NavigationTargets = { [key in VeronaNavigationTarget]: number | null };
