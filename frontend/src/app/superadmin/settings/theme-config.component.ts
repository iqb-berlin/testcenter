import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { ThemeService, THEMES, Theme } from '../../shared/services/theme.service';

@Component({
  selector: 'tc-theme-config',
  imports: [
    MatRadioGroup,
    MatRadioButton,
    FormsModule
  ],
  template: `
    <mat-radio-group [(ngModel)]="this.themeService.currentTheme" (change)="themeService.setTheme()">
      @for (theme of THEMES; track theme.name) {
        <mat-radio-button [value]="theme.name">
          {{ theme.name }}
          <div class="theme-preview" [style.background-color]="theme.previewColor"></div>
        </mat-radio-button>
      }
    </mat-radio-group>
  `,
  styles: `
    mat-radio-group {
      display: flex;
      flex-direction: column;
    }
    :host ::ng-deep mat-radio-group label {
      display: flex;
      align-items: center;
    }
    .theme-preview {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      border: 1px solid #ccc;
      margin-left: 15px;
    }
  `
})
export class ThemeConfigComponent {
  protected readonly THEMES: Theme[] = THEMES;

  constructor(public themeService: ThemeService) { }
}
