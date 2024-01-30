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
  readonly source: BlockConditionSource;
  readonly expression: BlockConditionExpression;
}

export interface BlockConditionSource {
  readonly variable: string;
  readonly unitAlias: string;
}

export interface BlockConditionAggregation {
  readonly type: 'count';
  readonly conditions: BlockCondition[];
}

export interface BlockConditionExpressionAggregation {
  readonly type: 'sum' | 'median';
  readonly expressions: BlockConditionExpression[];
}

export interface BlockConditionExpression {
  equal?: string;
  notEqual?: string;
  greaterThan?: number;
  lowerThan?: number;
}

export interface Restrictions {
  codeToEnter?: {
    readonly code: string;
    readonly message: string;
  };
  timeMax?: {
    readonly minutes: number
  };
  denyNavigationOnIncomplete?: {
    readonly presentation: 'ON' | 'OFF' | 'ALWAYS';
    readonly response: 'ON' | 'OFF' | 'ALWAYS';
  }
  readonly if?: Array<BlockCondition | BlockConditionAggregation | BlockConditionExpressionAggregation>
}

export interface ContextInBooklet<TestletType> {
  parents: TestletType[];
  // globalIndex: number;
  localUnitIndex: number;
  localTestletIndex: number;
  global: {
    unitIndex: number;
  };
}
