export type WidgetEvent = {
  type: 'vowStateChangedNotification';
  sessionId: string;
  timeStamp: number;
  state?: string;
} | {
  type: 'vowReturnRequested';
  sessionId: string;
  timeStamp: number;
  state?: string;
  saveState: boolean;
};

function timestamp(value: unknown): number {
  if (typeof value !== 'string') throw new Error('Missing widget timestamp');
  const parts = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!parts) throw new Error('Invalid widget timestamp');
  const [, year, month, day, hour, minute, second, offsetHour = '0', offsetMinute = '0'] = parts;
  const leap = Number(year) % 4 === 0 && (Number(year) % 100 !== 0 || Number(year) % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const parsed = Date.parse(value);
  if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 ||
      Number(day) > days[Number(month) - 1] || Number(hour) > 23 || Number(minute) > 59 ||
      Number(second) > 59 || Number(offsetHour) > 23 || Number(offsetMinute) > 59 || !Number.isFinite(parsed)) {
    throw new Error('Invalid widget timestamp');
  }
  return parsed;
}

export function widgetEvent(data: unknown): WidgetEvent {
  if (data === null || typeof data !== 'object' || !('type' in data) ||
      (data.type !== 'vowStateChangedNotification' && data.type !== 'vowReturnRequested') ||
      !('sessionId' in data) || typeof data.sessionId !== 'string' || !data.sessionId ||
      !('timeStamp' in data) || ('state' in data && typeof data.state !== 'string')) {
    throw new Error('Invalid widget state/return message');
  }
  const base = {
    sessionId: data.sessionId,
    timeStamp: timestamp(data.timeStamp),
    ...('state' in data && typeof data.state === 'string' ? { state: data.state } : {})
  };
  if (data.type === 'vowStateChangedNotification') return { ...base, type: data.type };
  if ('saveState' in data && typeof data.saveState !== 'boolean') throw new Error('Invalid widget saveState');
  return { ...base, type: data.type, saveState: !('saveState' in data) || data.saveState === true };
}
