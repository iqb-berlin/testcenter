// currently group-monitor and test-controller have parallel structures to represent booklets
// goal is to use the same interfaces in both areas: those in this file.

import { BookletConfig } from '../classes/booklet-config.class';

export interface BookletDef<TestletType> {
  readonly metadata: BookletMetadata;
  readonly config: BookletConfig;
  readonly restrictions?: Restrictions;
  readonly units: TestletType;
  readonly customTexts: { [p: string]: string };
}

export interface BookletMetadata {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface TestletDef<TestletType, UnitType> {
  readonly id: string;
  readonly label: string;
  readonly restrictions: Restrictions;
  readonly children: (TestletType | UnitType)[];
}

export interface UnitDef {
  readonly id: string;
  readonly alias: string;
  readonly label: string;
  readonly labelShort: string;
}

export interface BlockCondition {
  readonly source: BlockConditionSource | BlockConditionSourceAggregation | BlockConditionAggregation;
  readonly expression: BlockConditionExpression;
}

export const BlockConditionSourceTypes = ['Code', 'Value', 'Status', 'Score'];

export type BlockConditionSourceType = typeof BlockConditionSourceTypes[number];

export interface BlockConditionSource {
  readonly type: BlockConditionSourceType;
  readonly variable: string;
  readonly unitAlias: string;
  readonly default: string;
}

export const BlockConditionAggregationTypes = ['Count'];

export interface BlockConditionAggregation {
  readonly type: typeof BlockConditionAggregationTypes[number];
  readonly conditions: BlockCondition[];
}

export const BlockConditionSourceAggregationTypes = ['Sum', 'Median', 'Mean'];

export interface BlockConditionSourceAggregation {
  readonly type: typeof BlockConditionSourceAggregationTypes[number];
  readonly sources: BlockConditionSource[];
}

export const BlockConditionExpressionTypes = ['equal', 'notEqual', 'greaterThan', 'lowerThan'];

export interface BlockConditionExpression {
  readonly type: typeof BlockConditionExpressionTypes[number];
  readonly value: string;
}

export const sourceIsSingleSource =
  (source: BlockConditionSource | BlockConditionSourceAggregation | BlockConditionAggregation):
  source is BlockConditionSource => ('variable' in source);

export const sourceIsSourceAggregation =
  (source: BlockConditionSource | BlockConditionSourceAggregation | BlockConditionAggregation):
  source is BlockConditionSourceAggregation => ('sources' in source);

export const sourceIsConditionAggregation =
  (source: BlockConditionSource | BlockConditionSourceAggregation | BlockConditionAggregation):
  source is BlockConditionAggregation => ('conditions' in source);

export const maxTimeLeaveValues = ['confirm', 'forbidden'];
export type MaxTimeLeaveValue = typeof maxTimeLeaveValues[number];

export interface Restrictions {
  readonly codeToEnter?: {
    readonly code: string;
    readonly message: string;
  };
  readonly timeMax?: {
    readonly minutes: number;
    readonly leave: MaxTimeLeaveValue
  };
  readonly denyNavigationOnIncomplete?: {
    readonly presentation: 'ON' | 'OFF' | 'ALWAYS';
    readonly response: 'ON' | 'OFF' | 'ALWAYS';
  };
  readonly if: BlockCondition[];
  readonly lockAfterLeaving?: {
    readonly confirm: boolean;
    readonly scope: 'testlet' | 'unit'
  };
}

export interface ContextInBooklet<TestletType> {
  parents: TestletType[];
  // globalIndex: number;
  localUnitIndex: number;
  localTestletIndex: number;
  global: {
    unitIndex: number;
    config: BookletConfig;
  };
}
