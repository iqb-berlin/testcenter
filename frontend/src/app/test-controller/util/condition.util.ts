import { ResponseValueType as IQBVariableValueType } from '@iqb/responses/coding-interfaces';
import {
  BlockCondition,
  BlockConditionSource, sourceIsConditionAggregation,
  sourceIsSingleSource,
  sourceIsSourceAggregation
} from '../../shared/interfaces/booklet.interfaces';
import { IqbVariableUtil } from './iqb-variable.util';
import { IQBVariable, IQBVariableStatusList } from '../interfaces/iqb.interfaces';
import { AggregatorsUtil } from './aggregators.util';

export class ConditionUtil {
  static isSatisfied(
    condition: BlockCondition,
    getVar: (unitAlias: string, variableId: string) => IQBVariable | undefined
  ): boolean {
    const getSourceValue = (source: BlockConditionSource): string | number | undefined => {
      const variable = getVar(source.unitAlias, source.variable);
      if (!variable) return undefined;
      // eslint-disable-next-line default-case
      switch (source.type) {
        case 'Code': return variable.code ?? IqbVariableUtil.variableValueAsNumber(source.default) ?? NaN;
        case 'Value': return IqbVariableUtil.variableValueAsComparable(variable.value) ?? source.default ?? '';
        case 'Status': return variable.status ?? IQBVariableStatusList.find(s => s === source.default) ?? 'UNSET';
        case 'Score': return variable.score ?? IqbVariableUtil.variableValueAsNumber(source.default) ?? NaN;
      }
      return undefined;
    };

    const getSourceValueAsNumber = (source: BlockConditionSource): number => {
      const variable = getVar(source.unitAlias, source.variable);
      if (!variable) return NaN;
      // eslint-disable-next-line default-case
      switch (source.type) {
        case 'Code': return variable.code ?? IqbVariableUtil.variableValueAsNumber(source.default) ?? NaN;
        case 'Value': return IqbVariableUtil.variableValueAsNumber(variable.value);
        case 'Status': return IqbVariableUtil.statusIndex(variable.status) ?? 0;
        case 'Score': return variable.score ?? IqbVariableUtil.variableValueAsNumber(source.default) ?? NaN;
      }
      return NaN;
    };

    let value : IQBVariableValueType | undefined;
    if (sourceIsSingleSource(condition.source)) {
      value = ['greaterThan', 'lowerThan'].includes(condition.expression.type) ?
        getSourceValueAsNumber(condition.source) :
        getSourceValue(condition.source);
    }
    if (sourceIsSourceAggregation(condition.source)) {
      const aggregatorName = condition.source.type.toLowerCase();
      const values = condition.source.sources.map(getSourceValueAsNumber);
      if (aggregatorName in AggregatorsUtil && (typeof AggregatorsUtil[aggregatorName] === 'function')) {
        value = AggregatorsUtil[aggregatorName](values);
      }
    }
    if (sourceIsConditionAggregation(condition.source)) {
      if (condition.source.type === 'Count') {
        value = condition.source.conditions
          .map(cond => ConditionUtil.isSatisfied(cond, getVar))
          .filter(Boolean)
          .length;
      }
    }

    if (typeof value === 'undefined') {
      return false;
    }

    let compareValue: number | string = condition.expression.value;
    if (typeof value === 'number') {
      value = IqbVariableUtil.variableValueAsNumber(value); // truncate > 6 digits
      compareValue = IqbVariableUtil.variableValueAsNumber(compareValue);
    }

    // eslint-disable-next-line default-case
    switch (condition.expression.type) {
      case 'equal':
        return (value === compareValue) || (Number.isNaN(compareValue) && Number.isNaN(value));
      case 'notEqual':
        return value !== compareValue;
      case 'greaterThan':
        return IqbVariableUtil.variableValueAsNumber(value) > IqbVariableUtil.variableValueAsNumber(compareValue);
      case 'lowerThan':
        return IqbVariableUtil.variableValueAsNumber(value) < IqbVariableUtil.variableValueAsNumber(compareValue);
    }

    return false;
  }
}
