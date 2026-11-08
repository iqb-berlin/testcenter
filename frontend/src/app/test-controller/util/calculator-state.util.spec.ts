import { findNewCalculation } from './calculator-state.util';

describe('findNewCalculation', () => {
  function journal(...entries: { asLatex: string; asImage?: string }[]): string {
    return JSON.stringify(entries.map(entry => ({ asImage: '', ...entry })));
  }

  it('finds the calculation the state adds', () => {
    expect(findNewCalculation(undefined, journal({ asLatex: '1+1=2' }))).toBe('1+1=2');
    expect(findNewCalculation(journal({ asLatex: '1+1=2' }), journal({ asLatex: '1+1=2' }, { asLatex: '2*3=6' })))
      .toBe('2*3=6');
  });

  it('finds the calculation that pushes the oldest out of a full journal', () => {
    expect(findNewCalculation(
      journal({ asLatex: '1+1=2' }, { asLatex: '2*3=6' }),
      journal({ asLatex: '2*3=6' }, { asLatex: '4-1=3' })
    )).toBe('4-1=3');
  });

  it('finds none when the calculations stay the same, e.g. once the image is rendered', () => {
    expect(findNewCalculation(
      journal({ asLatex: '1+1=2', asImage: '' }),
      journal({ asLatex: '1+1=2', asImage: 'data:image/png;base64,AAAA' })
    )).toBeUndefined();
  });

  it('finds none in a state that is no journal', () => {
    expect(findNewCalculation(undefined, 'not json')).toBeUndefined();
    expect(findNewCalculation(undefined, '{"asLatex":"1+1=2"}')).toBeUndefined();
  });
});
