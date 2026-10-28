import { parseWidgetCall, widgetName } from './widget-start.util';

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

describe('calculator metadata identity', () => {
  const metadata = {
    type: 'WIDGET', id: 'calculator', version: '1.0.0', specVersion: '1.0', metadataVersion: '3.1',
    name: [{ lang: 'de', value: 'Rechner' }]
  };

  for (const expected of ['CALCULATOR', 'CALC']) {
    for (const actual of ['CALCULATOR', 'CALC']) {
      it(`accepts ${actual} when ${expected} is requested`, () => {
        expect(widgetName(JSON.stringify({ ...metadata, model: actual }), expected)).toBe('Rechner');
      });
    }
    for (const actual of ['calculator', 'calc', 'PERIODIC_TABLE', 'MOLECULE_EDITOR', null]) {
      it(`rejects model ${actual} when ${expected} is requested`, () => {
        expect(() => widgetName(JSON.stringify({ ...metadata, model: actual }), expected)).toThrowError();
      });
    }
    it(`still rejects an incompatible communication version for ${expected}`, () => {
      expect(() => widgetName(JSON.stringify({ ...metadata, model: expected, specVersion: '2.0' }), expected))
        .toThrowError();
    });
  }

  it('keeps other widget models exact', () => {
    expect(widgetName(JSON.stringify({ ...metadata, model: 'PERIODIC_TABLE' }), 'PERIODIC_TABLE')).toBe('Rechner');
    expect(() => widgetName(JSON.stringify({ ...metadata, model: 'CALCULATOR' }), 'PERIODIC_TABLE')).toThrowError();
    expect(() => widgetName(JSON.stringify({ ...metadata, model: 'CALC' }), 'MOLECULE_EDITOR')).toThrowError();
  });
});
