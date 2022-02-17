export function json(ob: unknown): unknown {
  return JSON.parse(JSON.stringify(ob));
}

export const perSequenceId = <T>(agg: { [index: number]: T }, stuff: T, index: number): { [index: number]: T } => {
  agg[index + 1] = stuff;
  return agg;
};
