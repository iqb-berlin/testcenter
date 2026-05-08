import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardHeader } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { ThemeService } from '@shared/services/theme.service';

@Component({
  selector: 'tc-test-card',
  imports: [
    MatButton,
    MatCard,
    MatCardActions,
    MatCardHeader,
    MatIcon
  ],
  template: `
    <mat-card>
      @if (index !== undefined) {
        <div class="number">{{index + 1}}</div>
      }
      <div class="flex-column">
        <mat-card-header>
          <p>{{ name + (subLabel ? ' ('+subLabel+')' : '')}}</p>
        </mat-card-header>
        <mat-card-actions>
          <button matButton="filled" [disabled]="disabled" (click)="select.emit()">
            @if (mode) {
              <mat-icon [svgIcon]="icons[mode]"></mat-icon>
            }
            {{ buttonLabel ? buttonLabel : mode ? labels[mode] : 'Bearbeiten' }}
          </button>
        </mat-card-actions>
      </div>
      @if (mode === 'locked') {
        <img class="done-image" [src]="themeService.activeTheme.imagePaths?.starterCardDone"
             alt="companion-test-done"/>
      }
    </mat-card>
  `,
  styles: `
    mat-card {
      padding: 16px 24px;
      border-radius: 4px;
      border: 1px solid var(--mat-sys-primary);
      flex-direction: row;
      align-items: center;
      gap: 24px;
    }
    .number {
      font-size: 57px;
    }
    mat-card-header {
      padding: 0;
    }
    :host ::ng-deep mat-card button .mat-icon {
      vertical-align: bottom;
    }
    .done-image {
      position: absolute;
      right: 1px;
      bottom: 1px;
    }
  `
})
export class TestCardComponent {
  @Input() name!: string;
  @Input() subLabel?: string;
  @Input() index?: number;
  @Input() buttonLabel?: string;
  @Input() mode?: 'start' | 'continue' | 'view' | 'locked';
  @Input() disabled?: boolean = false;
  @Output() select: EventEmitter<void> = new EventEmitter<void>();

  icons = {
    start: 'play_arrow',
    continue: 'play_pause',
    view: 'mystery',
    locked: 'block'
  };

  labels = {
    start: 'Starten',
    continue: 'Fortsetzen',
    view: 'Ansehen',
    locked: 'gesperrt'
  };

  constructor(public themeService: ThemeService) { }
}
