import { TestStateUtil } from './test-state.util';
import { TestStateUpdate } from '../interfaces/test-controller.interfaces';

fdescribe('The TestDataUtil', () => {
  it('should merge incoming testState changes by key and date and sort by TestId', () => {
    const result: TestStateUpdate[] = TestStateUtil.sort<TestStateUpdate>([
      {
        testId: 'current',
        unitAlias: '',
        state: [
          { key: 'CURRENT_UNIT_ID', content: '1', timeStamp: 30 },
          { key: 'CURRENT_UNIT_ID', content: '2', timeStamp: 20 },
          { key: 'CURRENT_UNIT_ID', content: '3', timeStamp: 10 },
          { key: 'FOCUS', content: 'HAS', timeStamp: 20 },
          { key: 'FOCUS', content: 'HAS_NOT', timeStamp: 10 }
        ]
      },
      {
        testId: 'old',
        unitAlias: '',
        state: [
          { key: 'CURRENT_UNIT_ID', content: '4', timeStamp: 40 }
        ]
      },
      {
        testId: 'current',
        unitAlias: '',
        state: [
          { key: 'CURRENT_UNIT_ID', content: '5', timeStamp: 15 },
          { key: 'CONTROLLER', content: 'is controlling', timeStamp: 3 }
        ]
      }
    ]);
    const expectation: TestStateUpdate[] = [
      {
        testId: 'current',
        unitAlias: '',
        state: [
          { key: 'CURRENT_UNIT_ID', content: '1', timeStamp: 30 },
          { key: 'FOCUS', content: 'HAS', timeStamp: 20 },
          { key: 'CONTROLLER', content: 'is controlling', timeStamp: 3 }
        ]
      },
      {
        testId: 'old',
        unitAlias: '',
        state: [
          { key: 'CURRENT_UNIT_ID', content: '4', timeStamp: 40 }
        ]
      }
    ];
    expect(result).toEqual(expectation);
  });
});
