type Verona2NavigationTarget = 'next' | 'previous' | 'first' | 'last' | 'end';

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
  startPage?: string;
  stateReportPolicy: Verona2StateReportPolicy; // removed in Verona4, but we still need it to support older players
}

interface Verona4PlayerConfig extends Verona3PlayerConfig {
  directDownloadUrl?: string;
}

type Verona3NavigationDeniedReason = 'presentationIncomplete' | 'responsesIncomplete';

// 'complete-and-valid' was removed in Verona3 but as long as we support verona2 it's still a valid state
const Verona2ProgressCompleteValues = ['complete', 'complete-and-valid'];
const Verona2ProgressIncompleteValues = ['none', 'some'];

const Verona2ProgressValues = [...Verona2ProgressIncompleteValues, ...Verona2ProgressCompleteValues];

type Verona3Progress = typeof Verona2ProgressValues[number];

export const isVeronaProgress = (value: string): value is Verona3Progress => Verona2ProgressValues.includes(value);

export { Verona4PlayerConfig as VeronaPlayerConfig };
export { Verona2NavigationTarget as VeronaNavigationTarget };
export { Verona3NavigationDeniedReason as VeronaNavigationDeniedReason };
export { Verona2ProgressIncompleteValues as VeronaProgressInCompleteValues };
