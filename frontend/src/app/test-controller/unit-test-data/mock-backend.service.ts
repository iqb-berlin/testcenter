import { Observable, of, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  TestBookletXmlVariants, AllTestResources, TestTestState, TestUnits, TestResources
} from './test-data';
import { LoadingFile, TestData, UnitData } from '../interfaces/test-controller.interfaces';

export class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  getTestData(testId: keyof typeof TestBookletXmlVariants): Observable<TestData> {
    return of({
      xml: TestBookletXmlVariants[testId],
      mode: 'run-hot-return',
      laststate: TestTestState,
      resources: TestResources,
      firstStart: false,
      workspaceId: Object.keys(TestBookletXmlVariants).indexOf(testId)
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getUnitData(testId: keyof typeof TestBookletXmlVariants, unitid: string): Observable<UnitData | boolean> {
    return of(TestUnits[unitid] || false);
  }

  // eslint-disable-next-line class-methods-use-this
  getResource(workspaceId: number, path: keyof typeof AllTestResources): Observable<LoadingFile> {
    if (
      workspaceId === Object.keys(TestBookletXmlVariants).indexOf('withMissingPlayer') &&
      path === 'Resource/A-PLAYER.HTML'
    ) {
      throw new Error('player is missing');
    }
    if (
      workspaceId === Object.keys(TestBookletXmlVariants).indexOf('withMissingUnitContent') &&
      path === 'Resource/test-unit-content-u3.voud'
    ) {
      throw new Error('resource is missing');
    }

    return of(
      { progress: 0 },
      { progress: 50 },
      { progress: 75 },
      { progress: 100 },
      { content: AllTestResources[path] }
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
