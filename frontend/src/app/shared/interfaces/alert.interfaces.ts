export const AlertLevels = ['error', 'warning', 'info', 'success'];
export type AlertLevel = typeof AlertLevels[number];
export const isAlertLevel = (expression: string): expression is AlertLevel => AlertLevels.includes(expression);
