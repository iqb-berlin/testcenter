import {
  Booklet, isUnit, Testlet, Unit
} from '../group-monitor.interfaces';

export class BookletUtil {
  static getFirstUnit(testletOrUnit: Testlet|Unit): Unit|null {
    while (!isUnit(testletOrUnit)) {
      if (!testletOrUnit.children.length) {
        return null;
      }
      // eslint-disable-next-line no-param-reassign,prefer-destructuring
      testletOrUnit = testletOrUnit.children[0];
    }
    return testletOrUnit;
  }

  static getFirstUnitOfBlock(blockId: string, booklet: Booklet): Unit|null {
    for (let i = 0; i < booklet.units.children.length; i++) {
      const child = booklet.units.children[i];
      if (!isUnit(child) && (child.blockId === blockId)) {
        return BookletUtil.getFirstUnit(child);
      }
    }
    return null;
  }

  static getBlockById(blockId: string, booklet: Booklet): Testlet {
    return <Testlet>booklet.units.children
      .filter(testletOrUnit => !isUnit(testletOrUnit))
      .reduce((found: Testlet, block: Testlet) => ((block.blockId === blockId) ? block : found), null);
  }
}
