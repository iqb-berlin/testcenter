import { initialWidgetWidth } from './initial-widget-width.util';

describe('Initial widget width policy', () => {
  it('provides a usable default for unknown widget models', () => {
    const width = initialWidgetWidth('CUSTOM_WIDGET');
    expect(Number.isFinite(width)).toBeTrue();
    expect(width).toBeGreaterThan(0);
    expect(initialWidgetWidth('ANOTHER_CUSTOM_WIDGET')).toBe(width);
  });

  it('uses the same width for both calculator model names', () => {
    expect(initialWidgetWidth('CALC')).toBe(initialWidgetWidth('CALCULATOR'));
  });

  it('gives the calculator a more compact workspace than the general default', () => {
    const width = initialWidgetWidth('CALCULATOR');
    expect(Number.isFinite(width)).toBeTrue();
    expect(width).toBeGreaterThan(0);
    expect(width).toBeLessThan(initialWidgetWidth('CUSTOM_WIDGET'));
  });
});
