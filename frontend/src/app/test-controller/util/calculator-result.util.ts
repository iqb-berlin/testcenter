export interface CalculatorResult {
  image: string;
  formula: string;
}

function latestCalculatorEntry(state: string): object | undefined {
  let journal: unknown;
  try {
    journal = JSON.parse(state);
  } catch {
    return undefined;
  }
  if (!Array.isArray(journal)) return undefined;
  const entry: unknown = journal.at(-1);
  return entry !== null && typeof entry === 'object' ? entry : undefined;
}

/** Read only the newest calculation, independently of its optional image. */
export function calculatorFormula(state: string): string | undefined {
  const entry = latestCalculatorEntry(state);
  return entry && 'asLatex' in entry && typeof entry.asLatex === 'string' ? entry.asLatex : undefined;
}

/** Read only the newest journal entry for the result window. */
export function calculatorResult(state: string): CalculatorResult | undefined {
  const entry = latestCalculatorEntry(state);
  if (!entry || !('asImage' in entry) || typeof entry.asImage !== 'string') return undefined;

  const image = entry.asImage;
  // Accept embedded raster images only, never remote URLs or active image formats.
  if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) return undefined;
  return {
    image,
    formula: 'asLatex' in entry && typeof entry.asLatex === 'string' ? entry.asLatex : ''
  };
}
