import { of } from 'rxjs';

export const matIconRegistryMock = {
  addSvgIconSet: () => matIconRegistryMock,
  getNamedSvgIcon: (name: string, namespace?: string) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    return of(svg);
  }
};
