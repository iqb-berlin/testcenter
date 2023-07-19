import { BehaviorSubject } from 'rxjs';
import { Watcher } from './watcher.util';

class TestObjectBluePrint {
  observable$ = new BehaviorSubject<string>('init');
  // eslint-disable-next-line class-methods-use-this
  aFunction(firstParam: string, secondParam: number): boolean {
    return ((Number(firstParam)) === secondParam);
  }
}

describe('The watcher', () => {
  it('should watch a function and apply a mapping function to the logged arguments', () => {
    const testObject = new TestObjectBluePrint();
    const watcher = new Watcher();
    watcher.watchMethod(
      'testObject',
      testObject,
      'aFunction',
      {
        1: n => n * 10
      }
    ).subscribe(result => {
      expect(result).toEqual(['4', 2]);
    });
    testObject.aFunction('4', 2);
    expect(watcher.log).toEqual([{ name: 'testObject.aFunction', value: ['4', 20] }]); // 20 = 2 * 10, mapper applied
  });

  it('should watch a function and omit an argument in log if the mapper maps it to null', () => {
    const testObject = new TestObjectBluePrint();
    const watcher = new Watcher();
    watcher.watchMethod(
      'testObject',
      testObject,
      'aFunction',
      {
        1: null
      }
    ).subscribe(result => {
      expect(result).toEqual(['4', 2]);
    });
    testObject.aFunction('4', 2);
    expect(watcher.log).toEqual([{ name: 'testObject.aFunction', value: ['4'] }]);
  });

  it('should watch an observable', () => {
    const testObject = new TestObjectBluePrint();
    const watcher = new Watcher();
    watcher.watchObservable('observable$', testObject.observable$);
    testObject.observable$.next('1st');
    expect(watcher.log).toEqual([{ name: 'observable$', value: 'init' }, { name: 'observable$', value: '1st' }]);
  });

  it('should watch a promise', async () => {
    const promise = new Promise(resolve => { setTimeout(() => resolve('value'), 1); });
    const originalResolvedWith = await promise;
    const watcher = new Watcher();
    const resolvedWithFromWatcher = await watcher.watchPromise('promise', promise);
    expect(originalResolvedWith).toEqual('value');
    expect(resolvedWithFromWatcher).toEqual('value');
    expect(watcher.log).toEqual([{ name: 'promise', value: 'value' }]);
  });
});
