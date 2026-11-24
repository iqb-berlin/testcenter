import { Injectable } from '@angular/core';
import type { AssetSlotName } from './asset.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  activeTheme: Theme;
  availableThemes = THEMES;

  constructor() {
    this.activeTheme = THEMES[0];
    document.body.className = this.activeTheme.cssClassName;
  }

  setTheme(themeName: string = this.availableThemes[0].name) {
    let newTheme = THEMES.find(theme => theme.name === themeName);
    if (!newTheme) {
      newTheme = THEMES[0];
      console.warn(`Theme "${themeName}" is not available, using "${newTheme.name}" instead.`);
    }
    this.activeTheme = newTheme;
    document.body.className = this.activeTheme.cssClassName;
  }
}

export interface Theme {
  name: string;
  cssClassName: string;
  previewColor?: string;
  description?: string;
  targetAudience: 'children' | 'teenager' | 'adults';
  imagePaths?: Partial<Record<AssetSlotName, string>>;
}

export const THEMES: Theme[] = [
  {
    name: 'Primar',
    cssClassName: 'theme-primar',
    previewColor: '#196175',
    description: 'Zielgruppe Schüler*innen der Primarstufe',
    targetAudience: 'children'
  },
  {
    name: 'Sekundar',
    cssClassName: 'theme-sekundar',
    previewColor: '#0B2D84',
    description: 'Zielgruppe Schüler*innen der Sekundarstufe I',
    targetAudience: 'teenager',
    imagePaths: {
      codeInputIllustration: 'assets/images/code-input-illustration-teens.png'
    }
  },
  {
    name: 'Erwachsene',
    cssClassName: 'theme-adult',
    previewColor: '#6B369A',
    description: 'Zielgruppe Erwachsenen (z. B. Lehrkräfte)',
    targetAudience: 'adults'
  }
];
