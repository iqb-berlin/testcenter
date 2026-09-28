import { superStates } from './super-states';

describe('superStates', () => {
  it('should only use icons from the icon sprite', async () => {
    const sprite = await (await fetch('assets/icons/material-icons.svg')).text();
    const iconIds = Array.from(new DOMParser().parseFromString(sprite, 'image/svg+xml').querySelectorAll('symbol'))
      .map(symbol => symbol.id);
    expect(iconIds.length).toBeGreaterThan(0);
    Object.values(superStates)
      .forEach(superState => expect(iconIds).withContext(superState.tooltip).toContain(superState.icon));
  });
});
