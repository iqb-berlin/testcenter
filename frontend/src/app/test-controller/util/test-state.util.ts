import { UnitStateUpdate, TestStateUpdate } from '../interfaces/test-controller.interfaces';

export class TestStateUtil {
  static sort<T extends UnitStateUpdate | TestStateUpdate>(stateBuffer: T[]): T[] {
    return Object.values(
      stateBuffer
        .reduce(
          (agg: { [objectId: string]: T }, stateUpdate: T): { [objectId: string]: T } => {
            const objectId = `${stateUpdate.testId}@@@${stateUpdate.unitAlias}`;
            if (!agg[objectId]) {
              agg[objectId] = <T>{
                testId: stateUpdate.testId,
                unitAlias: stateUpdate.unitAlias,
                state: <T['state']>[]
              };
            }
            const s : T['state'] = stateUpdate.state;
            // TODO X make it better than with ts-ignore
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            agg[objectId].state.push(...s);
            return agg;
          },
          <{ [objectId: string]: T }>{}
        ));
  }
}
