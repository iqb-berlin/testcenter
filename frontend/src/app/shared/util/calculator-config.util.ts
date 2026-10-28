import {
  CalculatorConfiguration, calculatorAttributeNames, calculatorDefaults, calculatorMinimums,
  calculatorModeValues
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
  const children = Array.from(testlet.children);
  const declarations = children.filter(child => child.tagName === 'Calculator');
  if (!declarations.length) return undefined;
  if (declarations.length !== 1) throw invalid(testlet, 'Nur eine <Calculator>-Deklaration ist erlaubt.');
  const calculator = declarations[0];
  const position = children.indexOf(calculator);
  if (children.some((child, index) =>
    (index < position && ['Unit', 'Testlet'].includes(child.tagName)) ||
    (index > position && child.tagName === 'Restrictions'))) {
    throw invalid(testlet, '<Calculator> muss nach <Restrictions> und vor Units oder Testlets stehen.');
  }
  for (const attribute of Array.from(calculator.attributes)) {
    if (!calculatorAttributeNames.some(name => name === attribute.name)) {
      throw invalid(testlet, `Unbekanntes Calculator-Attribut "${attribute.name}".`);
    }
  }
  const journalElements = Array.from(calculator.children);
  if (journalElements.length > 1 || journalElements.some(child => child.tagName !== 'Journal')) {
    throw invalid(testlet, '<Calculator> erlaubt nur ein optionales <Journal>-Kindelement.');
  }
  if (Array.from(calculator.childNodes).some(node =>
    (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) && node.textContent?.trim())) {
    throw invalid(testlet, 'Journal-Text muss innerhalb von <Journal> stehen.');
  }
  const journalElement = journalElements[0];
  if (journalElement && (journalElement.attributes.length || journalElement.children.length)) {
    throw invalid(testlet, '<Journal> darf nur JSON-Text enthalten.');
  }
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

  function enumAttribute<Value extends string>(key: string, values: readonly Value[], fallback?: Value): Value {
    const value = calculator.getAttribute(key);
    if (value === null && fallback !== undefined) return fallback;
    const parsed = values.find(candidate => candidate === value);
    if (parsed === undefined) throw invalid(testlet, `Calculator.${key} muss ${values.join(' oder ')} sein.`);
    return parsed;
  }

  function integerAttribute(key: string, fallback: number, minimum: number): number {
    const text = calculator.getAttribute(key);
    if (text === null) return fallback;
    const value = Number(text.trim());
    if (!/^[+-]?\d+$/.test(text.trim()) || !Number.isSafeInteger(value) || value < minimum) {
      throw invalid(testlet, `Calculator.${key} muss eine sicher darstellbare ganze Zahl ab ${minimum} sein.`);
    }
    return value;
  }

  return {
    mode: enumAttribute('mode', calculatorModeValues, calculatorDefaults.mode),
    journalLines: integerAttribute('journalLines', calculatorDefaults.journalLines, calculatorMinimums.journalLines),
    maxImageWidthPx: integerAttribute('maxImageWidthPx', calculatorDefaults.maxImageWidthPx,
                                      calculatorMinimums.maxImageWidthPx),
    journal
  };
}
