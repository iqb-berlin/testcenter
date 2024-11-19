import { Pipe, PipeTransform } from '@angular/core';
import { Testlet, TestSession } from '../group-monitor.interfaces';

@Pipe({
  name: 'timeleft'
})
export class TimeLeftPipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(testSession: TestSession, testlet: Testlet): number | false {
    return (testSession.timeLeft !== null) && (testSession.timeLeft[testlet.id] !== undefined) ?
      testSession.timeLeft[testlet.id] :
      false;
  }
}
