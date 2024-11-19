import { TestStateUtil } from './test-state.util';
import { TestStateUpdate, UnitDataParts } from '../interfaces/test-controller.interfaces';

describe('The TestStateUtil', () => {
  it('should sort incoming testState unit and TestId', (): void => {
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
          { key: 'CURRENT_UNIT_ID', content: '2', timeStamp: 20 },
          { key: 'CURRENT_UNIT_ID', content: '3', timeStamp: 10 },
          { key: 'FOCUS', content: 'HAS', timeStamp: 20 },
          { key: 'FOCUS', content: 'HAS_NOT', timeStamp: 10 },
          { key: 'CURRENT_UNIT_ID', content: '5', timeStamp: 15 },
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

  it('should sort incoming dataParts by unit and testId', (): void => {
    const result: UnitDataParts[] = TestStateUtil.sortDataParts([
      {
        testId: 'one',
        unitAlias: 'first',
        unitStateDataType: 'testData',
        dataParts: {
          'chunk1': 'somthing in chunk 1',
          'chunk2': 'somthing in chunk 2',
        }
      },
      {
        testId: 'one',
        unitAlias: 'first',
        unitStateDataType: 'testData',
        dataParts: {
          'chunk3': 'somthing in chunk 3',
          'chunk2': 'somthing New in chunk 2',
        }
      },
      {
        testId: 'two',
        unitAlias: 'first',
        unitStateDataType: 'testData',
        dataParts: {
          'chunk1': 'chunk 1 of first unit of test two',
        }
      },
      {
        testId: 'two',
        unitAlias: 'second',
        unitStateDataType: 'testData',
        dataParts: {
          'chunk1': 'chunk 1 of second unit of test two',
        }
      }
    ]);
    const expectation: UnitDataParts[] = [
      {
        testId: 'one',
        unitAlias: 'first',
        unitStateDataType: 'testData',
        dataParts: {
          'chunk1': 'somthing in chunk 1',
          'chunk2': 'somthing New in chunk 2',
          'chunk3': 'somthing in chunk 3',
        }
      },
      {
        testId: 'two',
        unitAlias: 'first',
        unitStateDataType: 'testData',
        dataParts: {
          'chunk1': 'chunk 1 of first unit of test two',
        }
      },
      {
        testId: 'two',
        unitAlias: 'second',
        unitStateDataType: 'testData',
        dataParts: {
          'chunk1': 'chunk 1 of second unit of test two',
        }
      }
    ];
    expect(result).toEqual(expectation);
  });
});
