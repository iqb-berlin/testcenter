import { unitTestExampleBooklets } from '../unit-test-example-data.spec';
import { BookletUtil } from './booklet.util';

describe('BookletUtil', () => {
  it('getFirstUnit() should get first unit if a testlet, regardless of nested sub-testlets', () => {
    expect(BookletUtil.getFirstUnit(unitTestExampleBooklets.example_booklet_1.units).id).toEqual('unit-1');
    expect(BookletUtil.getFirstUnit(unitTestExampleBooklets.example_booklet_2.units).id).toEqual('unit-1');
    expect(BookletUtil.getFirstUnit(unitTestExampleBooklets.example_booklet_2.units.children[2])).toBeNull();
  });

  describe('getBlockById()', () => {
    it('should return the block by id', () => {
      const result = BookletUtil.getBlockById('block-2', unitTestExampleBooklets.example_booklet_1);
      expect(result.id).toEqual('alf');
    });

    it('should return null when blockId is not found in booklet', () => {
      const result = BookletUtil.getBlockById('not-existing', unitTestExampleBooklets.example_booklet_1);
      expect(result).toBeNull();
    });
  });
});
