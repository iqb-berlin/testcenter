import {
  Booklet, isTestlet, isUnit, Testlet
} from '../group-monitor.interfaces';
import { UnitDef } from '../../shared/interfaces/booklet.interfaces';

export class BookletUtil {
  static getFirstUnit(testletOrUnit: Testlet | UnitDef): UnitDef | null {
    while (!isUnit(testletOrUnit)) {
      if (!testletOrUnit.children.length) {
        return null;
      }
      // eslint-disable-next-line no-param-reassign,prefer-destructuring
      testletOrUnit = testletOrUnit.children[0];
    }
    return testletOrUnit;
  }

  static getFirstUnitOfBlock(blockId: string, booklet: Booklet): UnitDef | null {
    for (let i = 0; i < booklet.units.children.length; i++) {
      const child = booklet.units.children[i] as Testlet;
      if (!isUnit(child) && (child.blockId === blockId)) {
        return BookletUtil.getFirstUnit(child);
      }
    }
    return null;
  }

  static getBlockById(blockId: string, booklet: Booklet): Testlet {
    return <Testlet>booklet.units.children
      .filter(isTestlet)
      .reduce((found: Testlet | null, block: Testlet) => ((block.blockId === blockId) ? block : found), null);
  }
}
