import { Testlet } from './test-controller.classes';
import { getBookletWithTwoBlocks } from '../unit-test-data/test-data';

describe('Testlet class', () => {
  let rootTestlet: Testlet;

  beforeEach(() => {
    rootTestlet = getBookletWithTwoBlocks();
  });

  describe('getSequenceIdByUnitAlias', () => {
    it('should return the corresponding sequenceId', () => {
      expect(rootTestlet.getSequenceIdByUnitAlias('u1')).toEqual(1);
      expect(rootTestlet.getSequenceIdByUnitAlias('u2')).toEqual(2);
      expect(rootTestlet.getSequenceIdByUnitAlias('u3')).toEqual(3);
      expect(rootTestlet.getSequenceIdByUnitAlias('u4')).toEqual(4);
      expect(rootTestlet.getSequenceIdByUnitAlias('u5')).toEqual(5);
      expect(rootTestlet.getSequenceIdByUnitAlias('i_dont_exist')).toEqual(0);
    });

    it('getUnitAt', () => {
      expect(rootTestlet.getUnitAt(0)).toBeNull();
      expect(rootTestlet.getUnitAt(1)).toEqual(jasmine.objectContaining({
        unitDef: rootTestlet.children[0],
        codeRequiringTestlets: [],
        maxTimerRequiringTestlet: null,
        testletLabel: ''
      }));
      expect(rootTestlet.getUnitAt(2)).toEqual(jasmine.objectContaining({
        unitDef: rootTestlet.children[1].children[0],
        codeRequiringTestlets: [rootTestlet.children[1]],
        maxTimerRequiringTestlet: rootTestlet.children[1],
        testletLabel: 'label of first block'
      }));
    });
  });
});
