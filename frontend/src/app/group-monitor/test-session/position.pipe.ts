/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-continue */
/* eslint-disable no-cond-assign */
import { Pipe, PipeTransform } from '@angular/core';
import {
  isUnit, Testlet, TestSession, Unit
} from '../group-monitor.interfaces';

@Pipe({
  name: 'position'
})
export class PositionPipe implements PipeTransform {
  transform(testSession: TestSession, theTestlet: Testlet): string {
    const c = {
      hiddenUnits: 0,
      hasShow: false,
      found: false,
      position: 0
    };
    const countHiddenChildren = (testlet: Testlet): void => {
      let i = 0;
      let child: Testlet | Unit;
      while (child = testlet.children[i++]) {
        if (isUnit(child)) {
          if (child.alias === testSession.current?.unit?.alias) {
            c.found = true;
            if (testSession.current) {
              c.position =
                testSession.current[theTestlet.id === '[0]' ? 'indexGlobal' : 'indexAncestor'] + 1 - c.hiddenUnits;
            }
          }
          continue;
        }
        if (child.restrictions.show) {
          c.hasShow = true;
        }
        countHiddenChildren(child);
        if (!!child.restrictions.show && !!testSession.optionalTestletsHidden?.includes(child.id)) {
          c.hiddenUnits += child.descendantCount;
        }
      }
    };
    countHiddenChildren(theTestlet);
    return `${c.position ? `${c.position} / ` : ''}${theTestlet.descendantCount - c.hiddenUnits}${c.hasShow ? '*' : ''}`;
  }
}
