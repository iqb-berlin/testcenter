const VIEWPORT_PERCENT = 95;

export const WIDGET_WINDOW_LIMITS = {
  viewportFraction: VIEWPORT_PERCENT / 100,
  maxWidth: `${VIEWPORT_PERCENT}vw`,
  maxHeight: `${VIEWPORT_PERCENT}vh`
} as const;
