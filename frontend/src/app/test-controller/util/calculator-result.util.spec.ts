import { calculatorFormula, calculatorResult } from './calculator-result.util';

describe('calculatorFormula', () => {
  it('reads only the last formula without requiring an image', () => {
    expect(calculatorFormula('[{"asLatex":"old","asImage":"old"},{"asLatex":"9=9"}]')).toBe('9=9');
    expect(calculatorFormula('[{"asLatex":""}]')).toBe('');
  });

  for (const state of ['', 'invalid', 'null', '{}', '[]', '[null]', '[1]',
    '[{"asLatex":"old"},{}]', '[{"asLatex":"old"},{"asLatex":null}]', '[{"asLatex":9}]']) {
    it(`ignores invalid or missing last formula in ${state}`, () => {
      expect(calculatorFormula(state)).toBeUndefined();
    });
  }
});

describe('calculatorResult', () => {
  const image = 'data:image/png;base64,iVBORw0KGgo=';

  it('reads the newest entry and provides its formula as image text', () => {
    expect(calculatorResult(JSON.stringify([
      { asImage: image, asLatex: 'old' }, { asImage: image, asLatex: '1+2=3' }
    ]))).toEqual({ image, formula: '1+2=3' });
  });

  it('accepts a JPEG result without optional formula text', () => {
    expect(calculatorResult('[{"asImage":"data:image/jpeg;base64,/9j/"}]'))
      .toEqual({ image: 'data:image/jpeg;base64,/9j/', formula: '' });
  });

  for (const state of ['', 'invalid', 'null', '{}', '[]', '[null]', '[1]',
    '[{"asImage":null}]', '[{"asImage":3}]', '[{"asImage":""}]',
    '[{"asImage":"https://example.org/image.png"}]',
    '[{"asImage":"data:image/svg+xml;base64,PHN2Zz4="}]',
    '[{"asImage":"data:image/png;base64,not base64"}]']) {
    it(`ignores invalid or unsupported state ${state}`, () => {
      expect(calculatorResult(state)).toBeUndefined();
    });
  }

  it('does not use an older result when the latest entry has no image', () => {
    expect(calculatorResult(JSON.stringify([{ asImage: image }, { asImage: null }])))
      .toBeUndefined();
  });
});
