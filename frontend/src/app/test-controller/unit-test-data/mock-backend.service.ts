import { Observable, of, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  TestBookletXmlVariants, TestResources, TestTestState, TestUnits
} from './test-data';
import { LoadingFile, TestData, UnitData } from '../interfaces/test-controller.interfaces';

export class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  getTestData(testId: keyof typeof TestBookletXmlVariants): Observable<TestData> {
    return of({
      xml: TestBookletXmlVariants[testId],
      mode: 'run-hot-return',
      laststate: TestTestState
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getUnitData(testId: keyof typeof TestBookletXmlVariants, unitid: string): Observable<UnitData | boolean> {
    return of(TestUnits[unitid] || false);
  }

  // eslint-disable-next-line class-methods-use-this
  getResource(testId: keyof typeof TestBookletXmlVariants, resId: string): Observable<LoadingFile> {
    if (testId === 'withMissingPlayer' && resId === 'A-PLAYER.HTML') {
      throw new Error('player is missing');
    }
    if (testId === 'withMissingUnitContent' && resId === 'test-unit-content-u3') {
      throw new Error('resource is missing');
    }

    return of(
      { progress: 0 },
      { progress: 50 },
      { progress: 75 },
      { progress: 100 },
      { content: TestResources[resId] }
    )
      .pipe(
        delay(1)
      );
  }

  // eslint-disable-next-line class-methods-use-this
  addTestLog(): Subscription {
    return of().subscribe();
  }
}
