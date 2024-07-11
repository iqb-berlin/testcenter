import { UnitStateUpdate, TestStateUpdate, UnitDataParts } from '../interfaces/test-controller.interfaces';

// TODO X unit test

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

  static sortDataParts = (dataPartsBuffer: UnitDataParts[]): UnitDataParts[] =>
    Object.values(dataPartsBuffer
      .reduce(
        (agg, dataParts) => {
          const objectId = `${dataParts.testId}@@@${dataParts.unitAlias}`;
          if (!agg[objectId]) agg[objectId] = {
            testId: dataParts.testId,
            unitAlias: dataParts.unitAlias,
            dataParts: {},
            // verona < 6 does not support different dataTypes for different Chunks, so we can just use the first one
            unitStateDataType: dataParts.unitStateDataType,
          };
          agg[objectId].dataParts = Object.assign({}, agg[objectId].dataParts, dataParts.dataParts);
          return agg;
        },
        <{ [objectId: string]: UnitDataParts }>{}
      ));
}
