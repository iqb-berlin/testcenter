import { SharedParameter } from '../interfaces/verona.interfaces';
import { VopWidgetCall, WidgetMessage, WidgetParameter } from '../interfaces/widget.interfaces';

function parseSharedParameters(value: unknown): SharedParameter[] {
  if (!Array.isArray(value)) throw new Error('Shared parameters must be an array');
  return value.map((parameter: unknown) => {
    if (parameter === null || typeof parameter !== 'object' ||
      !('key' in parameter) || typeof parameter.key !== 'string' || !parameter.key ||
      !('value' in parameter) || typeof parameter.value !== 'string') {
      throw new Error('Invalid shared parameter');
    }
    return { key: parameter.key, value: parameter.value };
  });
}

function parseTimeStamp(value: unknown): number {
  const timeStamp = typeof value === 'string' ? Date.parse(value) : NaN;
  if (Number.isNaN(timeStamp)) throw new Error('Invalid timeStamp');
  return timeStamp;
}

// Checks a state change or return message from a widget and converts its timeStamp to milliseconds.
export function parseWidgetMessage(data: object): WidgetMessage {
  if (!('type' in data) || (data.type !== 'vowStateChangedNotification' && data.type !== 'vowReturnRequested')) {
    throw new Error('Unknown message type');
  }
  if (!('sessionId' in data) || typeof data.sessionId !== 'string' || !data.sessionId) {
    throw new Error('Missing sessionId');
  }
  if ('state' in data && data.state !== undefined && typeof data.state !== 'string') {
    throw new Error('State must be a string');
  }
  const update = {
    sessionId: data.sessionId,
    timeStamp: parseTimeStamp('timeStamp' in data ? data.timeStamp : undefined),
    ...('state' in data && typeof data.state === 'string' ? { state: data.state } : {}),
    ...('sharedParameters' in data && data.sharedParameters !== undefined ?
      { sharedParameters: parseSharedParameters(data.sharedParameters) } :
      {})
  };
  if (data.type === 'vowStateChangedNotification') return { type: data.type, ...update };
  if ('saveState' in data && data.saveState !== undefined && typeof data.saveState !== 'boolean') {
    throw new Error('saveState must be a boolean');
  }
  return {
    type: data.type,
    ...update,
    saveState: !('saveState' in data) || data.saveState !== false
  };
}

function parseWidgetParameters(value: unknown): WidgetParameter[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('Widget parameters must be an array');
  return value.map((parameter: unknown) => {
    if (parameter === null || typeof parameter !== 'object' ||
      !('key' in parameter) || typeof parameter.key !== 'string' || !parameter.key ||
      ('value' in parameter && parameter.value !== undefined && typeof parameter.value !== 'string')) {
      throw new Error('Invalid widget parameter');
    }
    // the value is optional in the spec
    const value = 'value' in parameter && typeof parameter.value === 'string' ? parameter.value : '';
    return { key: parameter.key, value };
  });
}

// Checks a player's call for a widget.
export function parseVopWidgetCall(data: object): VopWidgetCall {
  if (!('type' in data) || data.type !== 'vopWidgetCall') throw new Error('Unknown message type');
  if (!('sessionId' in data) || typeof data.sessionId !== 'string' || !data.sessionId) {
    throw new Error('Missing sessionId');
  }
  if (!('widgetType' in data) || typeof data.widgetType !== 'string' || !data.widgetType) {
    throw new Error('Missing widgetType');
  }
  if ('callId' in data && data.callId !== undefined && typeof data.callId !== 'string') {
    throw new Error('callId must be a string');
  }
  if ('state' in data && data.state !== undefined && typeof data.state !== 'string') {
    throw new Error('State must be a string');
  }
  return {
    type: data.type,
    sessionId: data.sessionId,
    widgetType: data.widgetType,
    parameters: parseWidgetParameters('parameters' in data ? data.parameters : undefined),
    ...('callId' in data && typeof data.callId === 'string' ? { callId: data.callId } : {}),
    ...('state' in data && typeof data.state === 'string' ? { state: data.state } : {})
  };
}
