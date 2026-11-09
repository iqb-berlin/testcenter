import { CustomtextService } from '@shared/shared.module';
import { getWidgetIcon, getWidgetTitle, getWidgetWindowSize } from './widget-model.util';

describe('getWidgetTitle', () => {
  let cts: CustomtextService;

  beforeEach(() => {
    cts = new CustomtextService();
  });

  it('titles the widgets we know for test takers', () => {
    expect(getWidgetTitle('CALCULATOR', 'IQB Widget Taschenrechner', cts)).toBe('Taschenrechner');
    expect(getWidgetTitle('PERIODIC_TABLE', undefined, cts)).toBe('Periodensystem');
  });

  it('uses the custom text for a widget we know', () => {
    cts.addCustomTexts({ booklet_widgetTitleCalculator: 'Rechner' });
    expect(getWidgetTitle('CALCULATOR', 'IQB Widget Taschenrechner', cts)).toBe('Rechner');
  });

  it('uses the label of any other widget', () => {
    expect(getWidgetTitle('FORMULAS', 'Formelsammlung', cts)).toBe('Formelsammlung');
    expect(getWidgetTitle('toString', 'Formelsammlung', cts)).toBe('Formelsammlung');
  });

  it('falls back to a generic title', () => {
    expect(getWidgetTitle('FORMULAS', undefined, cts)).toBe('Widget');
  });
});

describe('getWidgetIcon and getWidgetWindowSize', () => {
  it('fall back to the defaults for any other widget', () => {
    expect(getWidgetIcon('toString')).toBe('widgets');
    expect(getWidgetWindowSize('toString')).toBeUndefined();
  });
});
