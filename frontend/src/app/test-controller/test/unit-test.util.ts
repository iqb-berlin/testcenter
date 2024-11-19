import { isObservable } from 'rxjs';
import { isTestlet, Testlet, Unit } from '../interfaces/test-controller.interfaces';

export function flattenTestlet(ob: unknown): unknown {
  return JSON.parse(JSON.stringify(ob, (key: string, value: unknown) => {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    if (['parent', 'through'].includes(key)) {
      const id = ('id' in value) ? value.id : '--';
      return `[Ref #${id}]`;
    }
    if (isObservable(value)) {
      return `[Observable ${key}]`;
    }
    return value;
  }));
}

export const showStructure = (node: Testlet | Unit | undefined, indent: number = 0): void => {
  // eslint-disable-next-line no-console
  console.log(`${Array.from({ length: indent }).map(_ => '---').join('')} ${node?.id || 'undefined'}`);
  if (node && isTestlet(node)) {
    node.children.forEach(child => showStructure(child, indent + 1));
  }
};
