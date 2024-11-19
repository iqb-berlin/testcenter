/* eslint-disable object-curly-newline */
import { ConditionUtil } from './condition.util';
import { IQBVariable } from '../interfaces/iqb.interfaces';
import { ResponseStatusType, ResponseValueType } from '@iqb/responses/coding-interfaces';
import { BlockCondition } from '../../shared/interfaces/booklet.interfaces';

const unitAlias = '';

const variables: { [key: string]: IQBVariable } = {
  var1: {
    id: 'var1',
    status: 'DISPLAYED',
    value: 'something',
    code: 1,
    score: 5
  },
  varNull: {
    id: 'varNull',
    status: 'UNSET',
    value: null
  },
  varNaN: {
    id: 'varNaN',
    status: 'UNSET',
    value: NaN
  },
  varInfinity: {
    id: 'varInfinity',
    status: 'UNSET',
    value: Infinity
  },
  varStringArray: {
    id: 'varStringArray',
    status: 'UNSET',
    value: ['this', 's', 'an', 'string', 'array']
  },
  varNumberArray: {
    id: 'varStringArray',
    status: 'UNSET',
    value: [0, 2, 3]
  },
  varBool: {
    id: 'varStringArray',
    status: 'UNSET',
    value: false
  },
  numvar1: {
    id: 'numvar1',
    status: 'VALUE_CHANGED',
    value: 4,
    code: 2,
    score: 5
  },
  numvar2: {
    id: 'numvar2',
    status: 'VALUE_CHANGED',
    value: 'something',
    code: 22,
    score: 10
  },
  numvar3: {
    id: 'numvar3',
    status: 'VALUE_CHANGED',
    value: 'something',
    code: 6,
    score: 35
  }
};

const getVar = (_: string, variableId: string): IQBVariable => variables[variableId];

describe('The ConditionUtil', () => {
  it('do equal and notEqual with everything', (): void => {
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'var1', default: '' },
      expression: { type: 'equal', value: 'something' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'var1', default: '' },
      expression: { type: 'equal', value: 'something else' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Status', unitAlias, variable: 'var1', default: '' },
      expression: { type: 'equal', value: 'DISPLAYED' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Code', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'equal', value: '2' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Code', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'equal', value: '3' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Code', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'notEqual', value: '3' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Code', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'notEqual', value: '2' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Score', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'equal', value: '5' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Score', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'equal', value: '4' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Score', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'notEqual', value: '4' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Score', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'notEqual', value: '5' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Score', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'equal', value: 'NaN' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Score', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'equal', value: 'STRING' }
    }, getVar)).toBeFalse();
  });

  it('do greaterThan and lowerThan with everything', (): void => {
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'greaterThan', value: '3' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'greaterThan', value: '4' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'lowerThan', value: '4' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'lowerThan', value: '5' }
    }, getVar)).toBeTrue();

    expect(ConditionUtil.isSatisfied({
      source: { type: 'Code', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'greaterThan', value: '1' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Code', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'greaterThan', value: '2' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Code', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'lowerThan', value: '2' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Code', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'lowerThan', value: '3' }
    }, getVar)).toBeTrue();

    expect(ConditionUtil.isSatisfied({
      source: { type: 'Score', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'greaterThan', value: '4' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Score', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'greaterThan', value: '5' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Score', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'lowerThan', value: '5' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Score', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'lowerThan', value: '6' }
    }, getVar)).toBeTrue();

    expect(ConditionUtil.isSatisfied({
      source: { type: 'Status', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'greaterThan', value: '2' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Status', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'greaterThan', value: '3' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Status', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'lowerThan', value: '3' }
    }, getVar)).toBeFalse();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Status', unitAlias, variable: 'numvar1', default: '' },
      expression: { type: 'lowerThan', value: '4' }
    }, getVar)).toBeTrue();
  });

  it('calculate aggregations', (): void => {
    expect(ConditionUtil.isSatisfied(<BlockCondition>{
      source: {
        type: 'Sum',
        sources: [
          { type: 'Score', unitAlias, variable: 'numvar1' },
          { type: 'Score', unitAlias, variable: 'numvar2' },
          { type: 'Score', unitAlias, variable: 'numvar3' }
        ]
      },
      expression: { type: 'equal', value: '50' }
    }, getVar)).toBeTrue();

    expect(ConditionUtil.isSatisfied(<BlockCondition>{
      source: {
        type: 'Median',
        sources: [
          { type: 'Score', unitAlias, variable: 'numvar1' },
          { type: 'Score', unitAlias, variable: 'numvar2' },
          { type: 'Score', unitAlias, variable: 'numvar3' }
        ]
      },
      expression: { type: 'equal', value: '10' }
    }, getVar)).toBeTrue();

    expect(ConditionUtil.isSatisfied(<BlockCondition>{
      source: {
        type: 'Mean',
        sources: [
          { type: 'Score', unitAlias, variable: 'numvar1' },
          { type: 'Score', unitAlias, variable: 'numvar2' },
          { type: 'Score', unitAlias, variable: 'numvar3' }
        ]
      },
      expression: { type: 'equal', value: '16.666666' }
    }, getVar)).toBeTrue();
  });

  it('count condition aggregations', (): void => {
    expect(ConditionUtil.isSatisfied(<BlockCondition>{
      source: {
        type: 'Count',
        conditions: [
          { source: { type: 'Score', unitAlias, variable: 'numvar1' }, expression: { type: 'equal', value: '5' } },
          { source: { type: 'Score', unitAlias, variable: 'numvar2' }, expression: { type: 'equal', value: '10' } },
          { source: { type: 'Score', unitAlias, variable: 'numvar3' }, expression: { type: 'equal', value: '100000' } }
        ]
      },
      expression: { type: 'equal', value: '2' }
    }, getVar)).toBeTrue();
  });

  it('take default values if necessary', (): void => {
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Score', unitAlias, variable: 'varNull', default: '999' },
      expression: { type: 'equal', value: '999' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'varNaN', default: '999' },
      expression: { type: 'equal', value: 'NaN' }
    }, getVar)).toBeTrue();
  });

  it('compare even esoteric values', (): void => {
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'varInfinity', default: '999' },
      expression: { type: 'equal', value: 'Infinity' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'varNumberArray', default: '999' },
      expression: { type: 'equal', value: '[0,2,3]' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'varStringArray', default: '999' },
      expression: { type: 'equal', value: '["an","array","s","string","this"]' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'varBool', default: 'true' },
      expression: { type: 'equal', value: 'false' }
    }, getVar)).toBeTrue();
    expect(ConditionUtil.isSatisfied({
      source: { type: 'Value', unitAlias, variable: 'varNull', default: 'thing' },
      expression: { type: 'equal', value: 'null' }
    }, getVar)).toBeTrue();
  });
});
