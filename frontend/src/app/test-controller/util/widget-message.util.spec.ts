import { parseVopWidgetCall } from './widget-message.util';
import { VopWidgetCall } from '../interfaces/widget.interfaces';

describe('parseVopWidgetCall', () => {
  const call: VopWidgetCall = {
    type: 'vopWidgetCall',
    sessionId: '3',
    callId: 'periodic-1',
    widgetType: 'PERIODIC_TABLE',
    parameters: [{ key: 'MAX_NUMBER_OF_SELECTIONS', value: '1' }],
    state: 'H'
  };

  it('accepts a call as the player sends it', () => {
    expect(parseVopWidgetCall(call)).toEqual(call);
  });

  it('accepts a call without callId, parameters and state', () => {
    expect(parseVopWidgetCall({ type: 'vopWidgetCall', sessionId: '3', widgetType: 'PERIODIC_TABLE' }))
      .toEqual({
        type: 'vopWidgetCall', sessionId: '3', widgetType: 'PERIODIC_TABLE', parameters: []
      });
  });

  it('gives a parameter without value an empty one', () => {
    expect(parseVopWidgetCall({ ...call, parameters: [{ key: 'CLOSE_ON_SELECTION' }] }).parameters)
      .toEqual([{ key: 'CLOSE_ON_SELECTION', value: '' }]);
  });

  [
    { problem: 'no sessionId', data: { ...call, sessionId: '' } },
    { problem: 'no widgetType', data: { ...call, widgetType: undefined } },
    { problem: 'a callId that is no string', data: { ...call, callId: 1 } },
    { problem: 'a state that is no string', data: { ...call, state: {} } },
    { problem: 'parameters that are no list', data: { ...call, parameters: {} } },
    { problem: 'a parameter without key', data: { ...call, parameters: [{ value: '1' }] } },
    { problem: 'a parameter value that is no string', data: { ...call, parameters: [{ key: 'A', value: 1 }] } }
  ].forEach(({ problem, data }) => {
    it(`rejects a call with ${problem}`, () => {
      expect(() => parseVopWidgetCall(data)).toThrowError();
    });
  });
});
