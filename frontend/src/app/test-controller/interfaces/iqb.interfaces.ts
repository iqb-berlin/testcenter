import { Response } from '@iqb/responses';

export interface IQBVariable extends Response {}

export const IQBVariableStatusList = ['UNSET', 'NOT_REACHED', 'DISPLAYED', 'VALUE_CHANGED', 'SOURCE_MISSING',
  'DERIVE_ERROR', 'VALUE_DERIVED', 'NO_CODING', 'INVALID', 'CODING_INCOMPLETE', 'CODING_ERROR', 'CODING_COMPLETE'];

export const isIQBVariable =
  (obj: object): obj is Response => (typeof obj === 'object') &&
    ('id' in obj) && ('status' in obj) && ('value' in obj);

