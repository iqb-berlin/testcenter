/* eslint-disable object-curly-newline */
import { TestSessionUtil } from './test-session.util';
import { unitTestExampleBooklets } from '../unit-test-example-data.spec';
import { Testlet, UnitContext } from '../group-monitor.interfaces';

describe('TestSessionUtil', () => {
  describe('getCurrent()', () => {
    it('should find correct indices for unit, parent and ancestor ( = top-level-testlet or root)', () => {
      const fakeTestlet = (id: string): Testlet => ({
        id,
        label: id,
        children: [],
        restrictions: { },
        descendantCount: NaN
      });
      const expectations: { [unitId: string]: UnitContext } = {
        'unit-1': {
          unit: undefined,
          indexGlobal: 0,
          indexAncestor: 0,
          indexLocal: 0,
          parent: fakeTestlet('root'),
          ancestor: fakeTestlet('root')
        },
        'unit-2': {
          unit: undefined,
          indexGlobal: 1,
          indexAncestor: 1,
          indexLocal: 1,
          parent: fakeTestlet('root'),
          ancestor: fakeTestlet('root')
        },
        'unit-3': {
          unit: undefined,
          indexGlobal: 2,
          indexAncestor: 0,
          indexLocal: 0,
          parent: fakeTestlet('alf'),
          ancestor: fakeTestlet('alf')
        },
        'unit-4': {
          unit: undefined,
          indexGlobal: 3,
          indexAncestor: 1,
          indexLocal: 0,
          parent: fakeTestlet('ben'),
          ancestor: fakeTestlet('alf')
        },
        'unit-5': {
          unit: undefined,
          indexGlobal: 4,
          indexAncestor: 2,
          indexLocal: 1,
          parent: fakeTestlet('ben'),
          ancestor: fakeTestlet('alf')
        },
        'unit-6': {
          unit: undefined,
          indexGlobal: 5,
          indexAncestor: 3,
          indexLocal: 0,
          parent: fakeTestlet('dolf'),
          ancestor: fakeTestlet('alf')
        },
        'unit-7': {
          unit: undefined,
          indexGlobal: 6,
          indexAncestor: 4,
          indexLocal: 1,
          parent: fakeTestlet('alf'),
          ancestor: fakeTestlet('alf')
        },
        'unit-8': {
          unit: undefined,
          indexGlobal: 7,
          indexAncestor: 2,
          indexLocal: 2,
          parent: fakeTestlet('root'),
          ancestor: fakeTestlet('root')
        },
        'unit-9': {
          unit: undefined,
          indexGlobal: 8,
          indexAncestor: 0,
          indexLocal: 0,
          parent: fakeTestlet('ellie'),
          ancestor: fakeTestlet('ellie')
        },
        'unit-10': {
          unit: undefined,
          indexGlobal: 9,
          indexAncestor: 1,
          indexLocal: 0,
          parent: fakeTestlet('fred'),
          ancestor: fakeTestlet('ellie')
        }
      };

      for (let i = 1; i < 11; i++) {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        const result = TestSessionUtil['getCurrent'](unitTestExampleBooklets.example_booklet_1.units, `unit-${i}`);
        const expectation = expectations[`unit-${i}`];
        expect(result.indexGlobal)
          .withContext(`global index of unit-${i}`)
          .toEqual(expectation.indexGlobal);
        expect(result.indexAncestor)
          .withContext(`ancestor-index of unit-${i}`)
          .toEqual(expectation.indexAncestor);
        expect(result.indexLocal)
          .withContext(`local index of unit-${i}`)
          .toEqual(expectation.indexLocal);
        expect(result.unit?.id)
          .withContext(`current unit of unit-${i}`)
          .toEqual(`unit-${i}`);
        expect(result.parent?.id)
          .withContext(`parent of unit-${i}`)
          .toEqual(expectation.parent?.id);
        expect(result.ancestor?.id)
          .withContext(`ancestor of unit-${i}`)
          .toEqual(expectation.ancestor?.id);
      }
    });

    it('should find return a unitContext without unit for not existing id', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const result = TestSessionUtil['getCurrent'](unitTestExampleBooklets.example_booklet_1.units, 'not-existing');
      expect(result.unit).toBeUndefined();
    });
  });

  describe('stateString()', () => {
    it('should merge state object values if available', () => {
      const stateObject = {
        first_key: 'first_value',
        second_key: 'second_value'
      };

      let result = TestSessionUtil.stateString(stateObject, ['first_key'], '|');
      let expectation = 'first_value';
      expect(result).withContext('one existing value').toEqual(expectation);

      result = TestSessionUtil.stateString(stateObject, ['first_key', 'second_key'], '|');
      expectation = 'first_value|second_value';
      expect(result).withContext('two existing values').toEqual(expectation);

      result = TestSessionUtil.stateString(stateObject, ['first_key', 'second_key', 'not_existing'], '|');
      expectation = 'first_value|second_value';
      expect(result).withContext('two existing values and one not existing').toEqual(expectation);
    });
  });

  describe('hasState()', () => {
    it('should check correctly if state is in state-object', () => {
      const stateObject = {
        first_key: 'first_value',
        second_key: null
      };

      let result = TestSessionUtil.hasState(stateObject, 'first_key', 'first_value');
      expect(result).withContext('key exists and has value').toBeTrue();

      result = TestSessionUtil.hasState(stateObject, 'first_key', 'something_else');
      expect(result).withContext('key exists and not has value').toBeFalse();

      result = TestSessionUtil.hasState(stateObject, 'first_key');
      expect(result).withContext('key exists').toBeTrue();

      result = TestSessionUtil.hasState(stateObject, 'non_existing_key');
      expect(result).withContext('key exists not').toBeFalse();
    });
  });
});
