const Verona2NavigationTargetValues = ['next', 'previous', 'first', 'last', 'end'] as const;

export const VeronaNavigationTargetValues = Verona2NavigationTargetValues;

type Verona2NavigationTarget = typeof Verona2NavigationTargetValues[number];

type Verona2LogPolicy = 'disabled' | 'lean' | 'rich' | 'debug';

type Verona2StateReportPolicy = 'none' | 'eager' | 'on-demand';

type Verona3PagingMode = 'separate' | 'concat-scroll' | 'concat-scroll-snap';

interface Verona2PlayerConfig {
  logPolicy: Verona2LogPolicy;
  pagingMode: Verona3PagingMode;
  unitNumber: number;
  unitTitle: string;
  unitId: string;
}

interface Verona3PlayerConfig extends Verona2PlayerConfig {
  enabledNavigationTargets: Verona2NavigationTarget[];
  startPage?: string | number;
  stateReportPolicy: Verona2StateReportPolicy; // removed in Verona4, but we still need it to support older players
}

interface Verona4PlayerConfig extends Verona3PlayerConfig {
  directDownloadUrl?: string;
}

type Verona3NavigationDeniedReason = 'presentationIncomplete' | 'responsesIncomplete';

// 'complete-and-valid' was removed in Verona3 but as long as we support verona2 it's still a valid state
const Verona2ProgressCompleteValues = ['complete', 'complete-and-valid'];
const Verona2ProgressIncompleteValues = ['none', 'some'];

const VeronaProgressValues = [...Verona2ProgressIncompleteValues, ...Verona2ProgressCompleteValues] as const;

export type VeronaProgress = typeof VeronaProgressValues[number];
export const isVeronaProgress =
  (value: string): value is VeronaProgress => VeronaProgressValues.includes(value);
export { Verona2ProgressIncompleteValues as VeronaProgressIncompleteValues };
export { Verona2ProgressCompleteValues as VeronaProgressCompleteValues };

export type VeronaPlayerConfig = Verona4PlayerConfig;
export type VeronaNavigationTarget = Verona2NavigationTarget;
export type VeronaNavigationDeniedReason = Verona3NavigationDeniedReason;

export const isVeronaNavigationTarget = (value: string):
  value is VeronaNavigationTarget => (Verona2NavigationTargetValues as readonly string[]).includes(value);

export interface Verona5ValidPages {
  [id: string]: string
}

export interface Verona6ValidPage {
  id: string;
  label?: string;
}

export type Verona6ValidPages = Array<Verona6ValidPage>;

// those are just a proposal and not in any Verona-Standard right now
export const VeronaPlayerRuntimeErrorCodes = [
  'session-id-missing',
  'unit-definition-missing',
  'wrong-session-id',
  'unit-definition-type-unsupported',
  'unit-state-type-unsupported',
  'runtime-error'
];

export interface VeronaUnitState {
  dataParts?: { [chunkId: string]: string },
  presentationProgress?: VeronaProgress;
  responseProgress?: VeronaProgress;
  unitStateDataType?: string;
  [x: string]: unknown;
}

export interface VopStartCommand {
  type: 'vopStartCommand',
  sessionId: string;
  uniDefinition?: string;
  unitDefinitionType?: string;
  unitState: VeronaUnitState;
  playerConfig: Verona4PlayerConfig;
  [x: string]: unknown;
}

export interface VopStateChangedNotification {
  type: 'vopStateChangedNotification',
  sessionId: string;
  playerState?: {
    validPages?: Verona5ValidPages | Verona6ValidPages;
    currentPage?: string;
  },
  unitState?: VeronaUnitState;
  log?: {
    timeStamp: number;
    content: string;
    key: string;
  }[]
}

export interface VopRuntimeErrorNotification {
  type: 'vopRuntimeErrorNotification',
  sessionId: string;
  message: string;
  code: string;
}
