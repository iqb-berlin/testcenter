import { Pipe, PipeTransform } from '@angular/core';
import { isBooklet, TestSession } from '../group-monitor.interfaces';

@Pipe({
  name: 'bookletstates'
})
export class BookletStatesPipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(testSession: TestSession, state: string, stateOption: string): { state: string; option: string } | false {
    if (!isBooklet(testSession.booklet)) return false;
    return {
      state: testSession.booklet.states[state]?.label || state,
      option: testSession.booklet.states[state]?.options[stateOption]?.label || stateOption
    };
  }
}
