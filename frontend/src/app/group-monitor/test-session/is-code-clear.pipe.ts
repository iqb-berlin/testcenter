import { Pipe, PipeTransform } from '@angular/core';
import { Testlet, TestSession } from '../group-monitor.interfaces';

@Pipe({
  name: 'iscodeclear'
})
export class IsCodeClearPipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(testSession: TestSession, testlet: Testlet) {
    return testSession.clearedCodes && testSession.clearedCodes.includes(testlet.id);
  }
}