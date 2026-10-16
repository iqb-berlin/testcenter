export interface CalculatorResult {
  image: string;
  formula: string;
}

/** Read only the newest journal entry. Widget state remains opaque to the runtime. */
export function calculatorResult(state: string): CalculatorResult | undefined {
  let journal: unknown;
  try {
    journal = JSON.parse(state);
  } catch {
    return undefined;
  }
  if (!Array.isArray(journal)) return undefined;
  const entry: unknown = journal.at(-1);
  if (entry === null || typeof entry !== 'object' || !('asImage' in entry) ||
    typeof entry.asImage !== 'string') return undefined;

  const image = entry.asImage;
  // Accept embedded raster images only, never remote URLs or active image formats.
  if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) return undefined;
  return {
    image,
    formula: 'asLatex' in entry && typeof entry.asLatex === 'string' ? entry.asLatex : ''
  };
}
