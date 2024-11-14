// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
const getCircularReplacer = () => {
  const ancestors: unknown[] = [];
  const cycles: unknown[] = [];
  return function (key: unknown, value: unknown) {
    if (typeof value !== "object" || value === null) {
      return value;
    }
    // @ts-ignore
    while (ancestors.length > 0 && ancestors.at(-1) !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(value)) {
      const id = cycles.indexOf(value);
      return `[Circular Ref #${id}]`;
    }
    cycles.push(value);
    ancestors.push(value);
    return value;
  };
};

const sortReplacer =  (key: unknown, value: unknown) => {
  if (typeof value === "object" && value) {
    return Object.fromEntries(Object.entries(value as object).sort());
  }
  return value;
};

export function json(ob: unknown): unknown {
  return JSON.parse(JSON.stringify(ob, getCircularReplacer()));
}

export const perSequenceId = <T>(agg: { [index: number]: T }, stuff: T, index: number): { [index: number]: T } => {
  agg[index + 1] = stuff;
  return agg;
};

