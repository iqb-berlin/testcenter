import { ResponseValueType as IQBVariableValueType, } from '@iqb/responses';

export class IqbVariableUtil {
  static variableValueAsComparable(value: IQBVariableValueType): number | string | undefined {
    if (value == null) {
      return 0;
    }
    if (Array.isArray(value)) {
      return JSON.stringify(value.sort());
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return value;
  }

  static variableValueAsNumber(value: IQBVariableValueType | undefined): number {
    if (value == null) {
      return 0;
    }
    if (Array.isArray(value)) {
      return value.length;
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    if (typeof value === 'string') {
      return Number(value);
    }
    return value;
  }
}
