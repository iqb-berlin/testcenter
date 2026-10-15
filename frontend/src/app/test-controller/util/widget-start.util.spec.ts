import { parseWidgetCall } from './widget-start.util';

describe('parseWidgetCall', () => {
  const call = { type: 'vopWidgetCall', sessionId: 'unit-1', widgetType: 'PERIODIC_TABLE' };

  it('normalizes omitted parameter values and preserves explicit empty state and call IDs', () => {
    expect(parseWidgetCall({ ...call, callId: '', state: '', parameters: [{ key: 'mode' }] })).toEqual({
      ...call, type: 'vopWidgetCall', callId: '', state: '', parameters: [{ key: 'mode', value: '' }]
    });
    expect(parseWidgetCall(call)).toEqual({ ...call, type: 'vopWidgetCall', parameters: [] });
    expect(parseWidgetCall({ ...call, callId: undefined, state: undefined })).toEqual({
      ...call, type: 'vopWidgetCall', parameters: []
    });
  });

  for (const invalid of [null, [], {}, { ...call, type: 'vowReadyNotification' },
    { ...call, sessionId: '' }, { ...call, sessionId: 1 }, { ...call, widgetType: '' },
    { ...call, widgetType: 1 }, { ...call, callId: 1 }, { ...call, state: 1 },
    { ...call, parameters: {} }, { ...call, parameters: [{ key: 'mode', value: false }] }]) {
    it(`rejects malformed calls: ${JSON.stringify(invalid)}`, () => {
      expect(() => parseWidgetCall(invalid)).toThrowError();
    });
  }
});
