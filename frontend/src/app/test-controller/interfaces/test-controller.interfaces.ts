import { Observable } from 'rxjs';
import { CodingScheme, Response } from '@iqb/responses';
import { BookletDef, TestletDef, UnitDef } from '../../shared/interfaces/booklet.interfaces';
import { IQBVariable } from './iqb.interfaces';

export type LoadingQueueEntryTypeType = 'definition' | 'scheme';

export interface LoadingQueueEntry {
  sequenceId: number;
  file: string;
  type: LoadingQueueEntryTypeType
}

export interface KeyValuePairString {
  [K: string]: string;
}

export enum WindowFocusState {
  PLAYER = 'PLAYER',
  HOST = 'HOST',
  UNKNOWN = 'UNKNOWN'
}

export type UnitData = {
  dataParts: KeyValuePairString;
  unitResponseType: string;
  state: { [k in UnitStateKey]?: string };
  definition : string;
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

export enum TestStateKey {
  CURRENT_UNIT_ID = 'CURRENT_UNIT_ID',
  TESTLETS_TIMELEFT = 'TESTLETS_TIMELEFT',
  TESTLETS_CLEARED_CODE = 'TESTLETS_CLEARED_CODE',
  TESTLETS_LOCKED_AFTER_LEAVE = 'TESTLETS_LOCKED_AFTER_LEAVE',
  TESTLETS_SATISFIED_CONDITION = 'TESTLETS_SATISFIED_CONDITION',
  UNITS_LOCKED_AFTER_LEAVE = 'UNITS_LOCKED_AFTER_LEAVE',
  FOCUS = 'FOCUS',
  CONTROLLER = 'CONTROLLER',
  CONNECTION = 'CONNECTION'
}

/**
 * TestState.state
 * In what state is the whole controller?
 */
export enum TestControllerState {
  INIT = 'INIT',
  LOADING = 'LOADING',
  RUNNING = 'RUNNING',
  TERMINATED = 'TERMINATED',
  TERMINATED_PAUSED = 'TERMINATED_PAUSED',
  FINISHED = 'FINISHED',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR'
}

/**
 * TestState.FOCUS
 * Do the application-window has focus or not (because another window or tab has it)?
 */
export enum AppFocusState {
  HAS = 'HAS',
  HAS_NOT = 'HAS_NOT'
}

/**
 * TestState.CONNECTION
 * What kind of connection to the server do we have to receive possible commands from a group-monitor?
 * This can get a third special-value called LOST, which is set *by the backend* on connection loss.
 */
export enum TestStateConnectionValue {
  WEBSOCKET = 'WEBSOCKET',
  POLLING = 'POLLING'
}

export enum TestLogEntryKey {
  LOADCOMPLETE = 'LOADCOMPLETE'
}

export interface StateReportEntry {
  key: TestStateKey | TestLogEntryKey | UnitStateKey | string;
  timeStamp: number;
  content: string;
}

export interface UnitDataParts {
  unitAlias: string;
  dataParts: KeyValuePairString;
  unitStateDataType: string;
}

export enum UnitPlayerState {
  LOADING = 'LOADING',
  RUNNING = 'RUNNING'
}

export enum UnitStateKey {
  PRESENTATION_PROGRESS = 'PRESENTATION_PROGRESS',
  RESPONSE_PROGRESS = 'RESPONSE_PROGRESS',
  CURRENT_PAGE_ID = 'CURRENT_PAGE_ID',
  CURRENT_PAGE_NR = 'CURRENT_PAGE_NR',
  PAGE_COUNT = 'PAGE_COUNT',
  PLAYER = 'PLAYER'
}

export const isUnitStateKey = (key: string): key is UnitStateKey => Object.keys(UnitStateKey).includes(key);

export interface UnitStateUpdate {
  alias: string;
  state: StateReportEntry[]
}

// for testcontroller service ++++++++++++++++++++++++++++++++++++++++

export enum MaxTimerEvent {
  STARTED = 'STARTED',
  STEP = 'STEP',
  CANCELLED = 'CANCELLED',
  INTERRUPTED = 'INTERRUPTED',
  ENDED = 'ENDED'
}

export interface UnitNaviButtonData {
  sequenceId: number;
  disabled: boolean;
  shortLabel: string;
  longLabel: string;
  isCurrent: boolean;
  headline: string | null;
}

// for unithost ++++++++++++++++++++++++++++++++++++++++++++++++++++++
export interface PageData {
  index: number;
  id: string;
  type: '#next' | '#previous' | '#goto';
  disabled: boolean;
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
  readonly playerId: string;
  variables: { [variableId: string]: IQBVariable };
  baseVariableIds: string[];
  playerFileName: string;
  scheme: CodingScheme;
  responseType: string | undefined;
  definition: string;
  state: { [k in UnitStateKey]?: string };
  dataParts: KeyValuePairString; // in never versions of verona dataParts is part of state.
  // Since we have to handle both differently, we keep it separated here. Maybe this will change in the future.
  loadingProgress: { [resourceId in LoadingQueueEntryTypeType]?: Observable<LoadingProgress> };
  lockedAfterLeaving: boolean;
}

export const TestletLockTypes = ['condition', 'time', 'code', 'afterLeave'] as const;

export type TestletLockType = typeof TestletLockTypes[number];

export interface Testlet extends TestletDef<Testlet, Unit> {
  readonly blockLabel: string;
  locks: Required<{ [ type in TestletLockType ]: boolean }>
  locked: {
    by: TestletLockType;
    through: Testlet;
  } | null;
  timerId: string | null;
  firstUnsatisfiedCondition: number;
}

export type Booklet = BookletDef<Testlet>;

export function isUnit(testletOrUnit: Testlet | Unit): testletOrUnit is Unit {
  return !('children' in testletOrUnit);
}

export function isTestlet(testletOrUnit: Testlet | Unit): testletOrUnit is Testlet {
  return !isUnit(testletOrUnit);
}
