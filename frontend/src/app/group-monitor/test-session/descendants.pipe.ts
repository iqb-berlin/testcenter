import { Pipe, PipeTransform } from '@angular/core';
import { isTestlet, Testlet, TestSession } from '../group-monitor.interfaces';

@Pipe({
  name: 'descendants'
})
export class DescendantsPipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(testSession: TestSession, theTestlet: Testlet): number {
    const countChildren = (testlet: Testlet): number => testlet
      .children
      .filter(child => !isTestlet(child) || !testSession.lockedByCondition?.includes(child.id))
      .reduce((counter, child) => (isTestlet(child) ? countChildren(child) : 1) + counter, 0);
    return countChildren(theTestlet);
  }
}
