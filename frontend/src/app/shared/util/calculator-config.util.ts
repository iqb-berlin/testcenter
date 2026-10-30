import {
  CalculatorConfiguration, calculatorDefaults
} from 'testcenter-common/interfaces/calculator.interfaces';
import { AppError } from '../../app.interfaces';

function invalid(testlet: Element, description: string): AppError {
  return new AppError({
    label: 'Ungültige Taschenrechner-Konfiguration',
    description: `Testlet "${testlet.getAttribute('id') || ''}": ${description}`,
    type: 'xml'
  });
}

export function parseTestletCalculator(
  testlet: Element
): CalculatorConfiguration | undefined {
  // Booklet 18.1 structure, attributes and value ranges are validated on upload.
  const calculator = Array.from(testlet.children).find(child => child.tagName === 'Calculator');
  if (!calculator) return undefined;
  const journalElement = calculator.querySelector('Journal');
  const journal = journalElement ? journalElement.textContent || '' : calculatorDefaults.journal;
  let entries: unknown;
  try {
    entries = JSON.parse(journal);
  } catch {
    throw invalid(testlet, '<Journal> enthält ungültiges JSON.');
  }
  if (!Array.isArray(entries) || !entries.every((entry: unknown) =>
    entry !== null && typeof entry === 'object' &&
    'asLatex' in entry && typeof entry.asLatex === 'string' &&
    'asImage' in entry && typeof entry.asImage === 'string')) {
    throw invalid(testlet, '<Journal> muss ein JSON-Array mit asLatex und asImage als Zeichenfolgen enthalten.');
  }

  const integerAttribute = (key: string, fallback: number): number => {
    const text = calculator.getAttribute(key);
    if (text === null) return fallback;
    const value = Number(text);
    if (!Number.isSafeInteger(value)) {
      throw invalid(testlet, `Calculator.${key} muss eine sicher darstellbare ganze Zahl sein.`);
    }
    return value;
  };

  return {
    mode: (calculator.getAttribute('mode') ?? calculatorDefaults.mode) as CalculatorConfiguration['mode'],
    journalLines: integerAttribute('journalLines', calculatorDefaults.journalLines),
    maxImageWidthPx: integerAttribute('maxImageWidthPx', calculatorDefaults.maxImageWidthPx),
    journal
  };
}
