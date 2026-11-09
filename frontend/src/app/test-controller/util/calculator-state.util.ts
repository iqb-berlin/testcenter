// The calculator's state is its journal: a JSON array of the last calculations, oldest first, each with `asLatex` and
// `asImage` (see https://github.com/iqb-specifications/plugin-widget).

export interface Calculation {
  latex: string;
  // a data URL; missing when the calculator could not render it
  image?: string;
}

// Only embedded images are shown: an image the widget gives as a URL would make the Testcenter load it from elsewhere.
function isEmbeddedImage(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:image/');
}

// Returns the calculations in the state, oldest first; nothing for a state that isn't a journal.
function parseJournal(state: string | undefined): Calculation[] {
  if (state === undefined) return [];
  let journal: unknown;
  try {
    journal = JSON.parse(state);
  } catch {
    return [];
  }
  if (!Array.isArray(journal)) return [];
  return journal.flatMap((entry: unknown) => {
    if (entry === null || typeof entry !== 'object' || !('asLatex' in entry) || typeof entry.asLatex !== 'string') {
      return [];
    }
    const image = 'asImage' in entry && isEmbeddedImage(entry.asImage) ? entry.asImage : undefined;
    return [{ latex: entry.asLatex, ...(image !== undefined ? { image } : {}) }];
  });
}

// Returns the calculation the new state adds to the previous one. The calculator reports a calculation more than
// once (e.g. again once its image is rendered), so a state with the same calculations adds none.
export function findNewCalculation(previousState: string | undefined, state: string): string | undefined {
  const previous = parseJournal(previousState);
  const current = parseJournal(state);
  if (!current.length) return undefined;
  const isUnchanged = current.length === previous.length &&
    current.every((calculation, i) => calculation.latex === previous[i].latex);
  return isUnchanged ? undefined : current[current.length - 1].latex;
}

// Returns the newest calculation in the state if it has an image.
export function findLatestCalculationWithImage(state: string | undefined): Required<Calculation> | undefined {
  const latest = parseJournal(state).at(-1);
  return latest?.image !== undefined ? { latex: latest.latex, image: latest.image } : undefined;
}
