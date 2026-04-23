import { Injectable } from '@angular/core';
import { CustomImages } from '../interfaces/custom-images.interface';
import { AppError } from '../../app.interfaces';

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
    const newTheme = THEMES.find(theme => theme.name === themeName);
    if (!newTheme) {
      throw new AppError({
        type: 'warning',
        description: '',
        label: `Theme "${themeName}" konnte nicht geladen werden.`
      });
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
  imagePaths?: Partial<Record<keyof CustomImages, string>>
}

export const THEMES: Theme[] = [
  {
    name: 'Primar',
    cssClassName: 'theme-primar',
    previewColor: '#196175',
    description: 'Zielgruppe Schüler*innen der Primarstufe',
    imagePaths: {
      starterCompanion: 'assets/theme-images/theme-primar/starter-companion.svg',
      starterCardDone: 'assets/theme-images/theme-primar/starter-card-done.png',
      codeInputIllustration: 'assets/theme-images/theme-primar/code-input-illu.png',
      codeInputCompanion: 'assets/theme-images/theme-primar/code-input-companion',
      loadingProgress: 'assets/theme-images/theme-primar/loading.png'
    }
  },
  {
    name: 'Sekundar',
    cssClassName: 'theme-sekundar',
    previewColor: '#0B2D84',
    description: 'Zielgruppe Schüler*innen der Sekundarstufe I'
  },
  {
    name: 'Erwachsene',
    cssClassName: 'theme-adult',
    previewColor: '#6B369A',
    description: 'Zielgruppe Erwachsenen (z. B. Lehrkräfte)'
  }
];
