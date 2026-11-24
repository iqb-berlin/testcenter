import { Injectable } from '@angular/core';
import {
  BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable
} from 'rxjs';
import { AppError } from '../../app.interfaces';
import { MainDataService } from './maindata/maindata.service';
import type { AssetSlotName } from './asset.service';

// The active theme follows the current login: its own theme if it has one, the system default otherwise.
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly availableThemes = THEMES;

  private readonly _activeTheme$ = new BehaviorSubject<Theme>(THEMES[0]);
  readonly activeTheme$: Observable<Theme> = this._activeTheme$.asObservable();
  getActiveTheme(): Theme {
    return this._activeTheme$.getValue();
  }

  constructor(private mainDataService: MainDataService) {
    combineLatest([mainDataService.authData$, mainDataService.appConfig$])
      .pipe(
        map(([authData, appConfig]) => this.findTheme(authData?.viewSettings.theme || appConfig.themeName)),
        distinctUntilChanged()
      )
      .subscribe(theme => this._activeTheme$.next(theme));
    this.activeTheme$
      .subscribe((theme) => {
        document.body.className = theme.cssClassName;
      });
  }

  private findTheme(themeName: string): Theme {
    const theme = THEMES.find(t => t.name === themeName);
    if (theme) {
      return theme;
    }
    this.mainDataService.appError = new AppError({
      type: 'warning',
      description: '',
      label: `Theme "${themeName}" konnte nicht geladen werden.`
    });
    return THEMES[0];
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
