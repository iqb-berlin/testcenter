import { valid } from 'semver';
import { WidgetCall, WidgetParameter } from '../interfaces/widget.interfaces';
import { widgetModelCandidates } from './widget-model.util';

export function parseWidgetCall(data: unknown): WidgetCall {
  if (data === null || typeof data !== 'object' ||
    !('type' in data) || data.type !== 'vopWidgetCall' ||
    !('sessionId' in data) || typeof data.sessionId !== 'string' || !data.sessionId ||
    !('widgetType' in data) || typeof data.widgetType !== 'string' || !data.widgetType ||
    ('callId' in data && data.callId !== undefined && typeof data.callId !== 'string') ||
    ('state' in data && data.state !== undefined && typeof data.state !== 'string')) {
    throw new Error('Invalid widget call');
  }
  return {
    type: data.type,
    sessionId: data.sessionId,
    widgetType: data.widgetType,
    parameters: widgetParameters('parameters' in data ? data.parameters : undefined),
    ...('callId' in data && typeof data.callId === 'string' ? { callId: data.callId } : {}),
    ...('state' in data && typeof data.state === 'string' ? { state: data.state } : {})
  };
}

export function widgetParameters(value: unknown): WidgetParameter[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('Widget parameters must be an array');
  return value.map((item: unknown) => {
    if (item === null || typeof item !== 'object' || !('key' in item) ||
      typeof item.key !== 'string' || item.key.length < 2 ||
      ('value' in item && typeof item.value !== 'string')) {
      throw new Error('Invalid widget parameter');
    }
    const value = 'value' in item ? item.value : '';
    if (typeof value !== 'string') throw new Error('Invalid widget parameter value');
    return { key: item.key, value };
  });
}

// Validate the metadata fields needed to identify and start this widget.
export function widgetName(serialized: unknown, model: string): string {
  if (typeof serialized !== 'string') throw new Error('Widget metadata must be serialized JSON');
  const data: unknown = JSON.parse(serialized);
  if (data === null || typeof data !== 'object' ||
    !('type' in data) || data.type !== 'WIDGET' ||
    !('model' in data) || typeof data.model !== 'string' || !widgetModelCandidates(model).includes(data.model) ||
    !('id' in data) || typeof data.id !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(data.id) ||
    !('version' in data) || typeof data.version !== 'string' || !valid(data.version) ||
    !('specVersion' in data) || data.specVersion !== '1.0' ||
    !('metadataVersion' in data) || data.metadataVersion !== '3.1' ||
    !('name' in data) || !Array.isArray(data.name) || !data.name.length) {
    throw new Error('Invalid or incompatible widget metadata');
  }
  const names = data.name.map((name: unknown) => {
    if (name === null || typeof name !== 'object' ||
      !('lang' in name) || typeof name.lang !== 'string' || !/^[a-z]{2}$/.test(name.lang) ||
      !('value' in name) || typeof name.value !== 'string' || !name.value.length) {
      throw new Error('Invalid widget name');
    }
    return { lang: name.lang, value: name.value };
  });
  return names.find(name => name.lang === 'de')?.value || names[0].value;
}
