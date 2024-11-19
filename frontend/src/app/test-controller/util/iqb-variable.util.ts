import { ResponseValueType as IQBVariableValueType } from '@iqb/responses';
import { IQBVariableStatusList } from '../interfaces/iqb.interfaces';

export class IqbVariableUtil {
  static variableValueAsComparable(value: IQBVariableValueType): number | string | undefined {
    if (value == null) return 'null';
    if (Array.isArray(value)) return JSON.stringify(value.sort());
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return value;
  }

  static variableValueAsNumber(value: IQBVariableValueType | undefined): number {
    const truncateDigits = (number: number): number => Math.floor(number * 1000000) / 1000000.0; // not rounding!
    if (typeof value === 'undefined') return 0;
    if (Number.isNaN(value)) return NaN;
    if (value == null) return 0;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'string') return truncateDigits(Number(value));
    return truncateDigits(value);
  }

  static variableValueAsString(value: IQBVariableValueType | undefined): string {
    if (value == null) return 'null';
    if (typeof value === 'undefined') return 'undefined';
    if (Array.isArray(value)) return value.map(IqbVariableUtil.variableValueAsString).join(', ');
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'string') return `"${value}"`;
    return String(value);
  }

  static statusIndex(statusString: string): number | undefined {
    return IQBVariableStatusList.indexOf(statusString) > -1 ? IQBVariableStatusList.indexOf(statusString) : undefined;
  }
}
