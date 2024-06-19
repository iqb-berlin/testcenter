import { TestDataUtil } from './test-data.util';
import { TestStateKey } from '../interfaces/test-controller.interfaces';

fdescribe('The TestDataUtil', () => {
  it('should merge incoming testState changes by key and date and sort by TestId', () => {
    const result = TestDataUtil.sortByTestId([
      {
        testId: 'current',
        state: [
          { key: TestStateKey.CURRENT_UNIT_ID, content: '1', timeStamp: 30 },
          { key: TestStateKey.CURRENT_UNIT_ID, content: '2', timeStamp: 20 },
          { key: TestStateKey.CURRENT_UNIT_ID, content: '3', timeStamp: 10 },
          { key: TestStateKey.FOCUS, content: 'HAS', timeStamp: 20 },
          { key: TestStateKey.FOCUS, content: 'HAS_NOT', timeStamp: 10 }
        ]
      },
      {
        testId: 'old',
        state: [
          { key: TestStateKey.CURRENT_UNIT_ID, content: '4', timeStamp: 40 }
        ]
      },
      {
        testId: 'current',
        state: [
          { key: TestStateKey.CURRENT_UNIT_ID, content: '5', timeStamp: 15 },
          { key: TestStateKey.CONTROLLER, content: 'is controlling', timeStamp: 3 }
        ]
      }
    ]);
    const expectation = [
      {
        testId: 'current',
        state: [
          { key: TestStateKey.CURRENT_UNIT_ID, content: '1', timeStamp: 30 },
          { key: TestStateKey.FOCUS, content: 'HAS', timeStamp: 20 },
          { key: TestStateKey.CONTROLLER, content: 'is controlling', timeStamp: 3 }
        ]
      },
      {
        testId: 'old',
        state: [
          { key: TestStateKey.CURRENT_UNIT_ID, content: '4', timeStamp: 40 }
        ]
      }
    ];
    expect(result).toEqual(expectation);
  });
});
