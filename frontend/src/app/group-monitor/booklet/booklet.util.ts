import {
  Booklet, isTestlet, isUnit, Testlet
} from '../group-monitor.interfaces';
import { UnitDef } from '../../shared/interfaces/booklet.interfaces';

export class BookletUtil {
  static getFirstUnit(
    testletOrUnit: Testlet | UnitDef,
    ignoreTestlet: (tetslet: Testlet) => boolean = () => false
  ): UnitDef | null {
    if (isUnit(testletOrUnit)) return testletOrUnit;
    if (ignoreTestlet(testletOrUnit)) return null;
    return testletOrUnit.children
      .reduce((firstUnit: UnitDef | null, child: Testlet | UnitDef) => {
        if (firstUnit) return firstUnit;
        return (isUnit(child) ? child : BookletUtil.getFirstUnit(child, ignoreTestlet));
      }, null);
  }

  static getFirstUnitOfBlock(
    blockId: string,
    booklet: Booklet,
    ignoreTestlet: (tetslet: Testlet) => boolean = () => false
  ): UnitDef | null {
    for (let i = 0; i < booklet.units.children.length; i++) {
      const child = booklet.units.children[i];
      if (!isUnit(child) && (child.blockId === blockId)) {
        return BookletUtil.getFirstUnit(child, ignoreTestlet);
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
