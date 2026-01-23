import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = THEMES[0].name;

  setTheme(themeName?: string) {
    document.body.className = themeName || this.currentTheme;
  }
}

export interface Theme {
  name: string;
  previewColor?: string;
}

export const THEMES: Theme[] = [
  { name: 'zg1-theme', previewColor: '#196175' },
  { name: 'zg2-theme', previewColor: '#0B2D84' },
  { name: 'zg3-theme', previewColor: '#6B369A' }
];
