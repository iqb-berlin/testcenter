export const IQBVariableStatusList = ['UNSET', 'NOT_REACHED', 'DISPLAYED', 'VALUE_CHANGED', 'SOURCE_MISSING',
  'DERIVE_ERROR', 'VALUE_DERIVED', 'NO_CODING', 'INVALID', 'CODING_INCOMPLETE', 'CODING_ERROR', 'CODING_COMPLETE'];

export type IQBVariableStatus = typeof IQBVariableStatusList[number];

export type IQBVariableValueType =
  number | string | null | boolean | Array<number | null> | Array<string | null> | Array<boolean | null>;

export interface IQBVariable {
  id: string;
  status: IQBVariableStatus;
  value: IQBVariableValueType;
  subform?: string;
  code?: number;
  score?: number;
}

export const isIQBVariable =
  (obj: object): obj is IQBVariable => (typeof obj === 'object') &&
    ('id' in obj) && ('status' in obj) && ('value' in obj);

export const isIQBVariableStatus = (str: string): str is IQBVariableStatus => IQBVariableStatusList.includes(str);
