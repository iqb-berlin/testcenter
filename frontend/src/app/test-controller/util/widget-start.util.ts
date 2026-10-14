import { valid } from 'semver';

export interface WidgetParameter {
  key: string;
  value: string;
}

export interface WidgetStartCommand {
  type: 'vowStartCommand';
  sessionId: string;
  parameters: WidgetParameter[];
  sharedParameters: WidgetParameter[];
  state?: string;
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
      !('model' in data) || data.model !== model ||
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
