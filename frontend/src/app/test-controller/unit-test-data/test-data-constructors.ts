// helper functions to construct easier testdata

import { Testlet, UnitDef } from '../classes/test-controller.classes';

type NonFunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T];
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export const testlet = (params: NonFunctionProperties<Testlet>): Testlet => {
  const testletInstance = new Testlet(params.sequenceId, params.id, params.title);
  testletInstance.codeToEnter = params.codeToEnter;
  testletInstance.codePrompt = params.codePrompt;
  testletInstance.maxTimeLeft = params.maxTimeLeft;
  testletInstance.children = params.children;
  return testletInstance;
};

export const unit = (params: NonFunctionProperties<UnitDef>): UnitDef => {
  const unitInstance = new UnitDef(
    params.sequenceId,
    params.id,
    params.title,
    params.alias,
    params.naviButtonLabel,
    params.navigationLeaveRestrictions
  );
  unitInstance.locked = params.locked;
  unitInstance.playerId = params.playerId;
  return unitInstance;
};
