import { TestStateUpdate } from '../interfaces/test-controller.interfaces';

export class TestDataUtil {
  // static mergeStates = (states: StateReportEntry[]): StateReportEntry[] => Object.values(
  //   states
  //     .reduce(
  //       (agg: { [key: string]: StateReportEntry }, stateUpdate: StateReportEntry) => {
  //         if (!agg[stateUpdate.key] || agg[stateUpdate.key].timeStamp < stateUpdate.timeStamp) {
  //           agg[stateUpdate.key] = stateUpdate;
  //         }
  //         return agg;
  //       },
  //       {}
  //     ));

  static sortByTestId = (stateBuffer: TestStateUpdate[]) => Object.values(
    stateBuffer
      .reduce(
        (agg: { [testId: string]: TestStateUpdate }, stateUpdate) => {
          if (!agg[stateUpdate.testId]) {
            agg[stateUpdate.testId] = { testId: stateUpdate.testId, state: [] };
          }
          agg[stateUpdate.testId].state.push(...stateUpdate.state);
          return agg;
        },
        {}
      ));
    // .map(buffer => ({ ...buffer, state: mergeStates(buffer.state) }));
}
