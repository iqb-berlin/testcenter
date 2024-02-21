import {
  Response as IQBVariable
} from '@iqb/responses';

export const IQBVariableStatusList = ['UNSET', 'NOT_REACHED', 'DISPLAYED', 'VALUE_CHANGED', 'SOURCE_MISSING',
  'DERIVE_ERROR', 'VALUE_DERIVED', 'NO_CODING', 'INVALID', 'CODING_INCOMPLETE', 'CODING_ERROR', 'CODING_COMPLETE'];

export type IQBVariableStatus = typeof IQBVariableStatusList[number];

export const isIQBVariable =
  (obj: object): obj is IQBVariable => (typeof obj === 'object') &&
    ('id' in obj) && ('status' in obj) && ('value' in obj);

export const isIQBVariableStatus = (str: string): str is IQBVariableStatus => IQBVariableStatusList.includes(str);