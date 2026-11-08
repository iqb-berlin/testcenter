// The calculator's state is its journal: a JSON array of the last calculations, oldest first, each with `asLatex` and
// `asImage` (see https://github.com/iqb-specifications/plugin-widget).

// Returns the calculations in the state as LaTeX, oldest first; nothing for a state that isn't a journal.
function getCalculations(state: string | undefined): string[] {
  if (state === undefined) return [];
  let journal: unknown;
  try {
    journal = JSON.parse(state);
  } catch {
    return [];
  }
  if (!Array.isArray(journal)) return [];
  return journal.flatMap((entry: unknown) => (
    entry !== null && typeof entry === 'object' && 'asLatex' in entry && typeof entry.asLatex === 'string' ?
      [entry.asLatex] :
      []
  ));
}

// Returns the calculation the new state adds to the previous one. The calculator reports a calculation more than
// once (e.g. again once its image is rendered), so a state with the same calculations adds none.
export function findNewCalculation(previousState: string | undefined, state: string): string | undefined {
  const previous = getCalculations(previousState);
  const current = getCalculations(state);
  if (!current.length) return undefined;
  const isUnchanged = current.length === previous.length && current.every((latex, i) => latex === previous[i]);
  return isUnchanged ? undefined : current[current.length - 1];
}
