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
  description?: string;
}

export const THEMES: Theme[] = [
  { name: 'zg1-theme', previewColor: '#196175', description: 'Zielgruppe Schüler*innen der Primarstufe' },
  { name: 'zg2-theme', previewColor: '#0B2D84', description: 'Zielgruppe Schüler*innen der Sekundarstufe I' },
  { name: 'zg3-theme', previewColor: '#6B369A', description: 'Zielgruppe Erwachsenen (z. B. Lehrkräfte)' }
];
