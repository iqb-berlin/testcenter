import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardHeader } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';

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
      <mat-card-header>
        <p>{{ name }}</p>
      </mat-card-header>
      <mat-card-actions>
        <button matButton="filled" [disabled]="disabled" (click)="select.emit()">
          @if (mode) {
            <mat-icon>{{ icons[mode] }}</mat-icon>
          }
          {{ buttonLabel ? buttonLabel : mode ? labels[mode] : 'Bearbeiten' }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    mat-card {
      width: 600px;
      padding: 16px 24px;
      border-radius: 4px;
      border: 1px solid var(--mat-sys-primary);
    }
    mat-card-header {
      padding: 0;
    }
    :host ::ng-deep mat-card button .mat-icon {
      vertical-align: bottom;
    }
  `
})
export class TestCardComponent {
  @Input() name!: string;
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
}
