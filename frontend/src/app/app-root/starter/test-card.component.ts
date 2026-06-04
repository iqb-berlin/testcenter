import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardHeader } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { AssetService } from '@shared/services/asset.service';
import { AsyncPipe } from '@angular/common';
import { CustomtextPipe } from '@shared/pipes/customtext/customtext.pipe';

@Component({
  selector: 'tc-test-card',
  imports: [
    MatButton,
    MatCard,
    MatCardActions,
    MatCardHeader,
    MatIcon,
    AsyncPipe,
    CustomtextPipe
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
          <button matButton="filled" [disabled]="disabled || mode === 'locked'" [class.test-done]="mode === 'locked'"
                  (click)="select.emit()">
            @if (mode) {
              <mat-icon [svgIcon]="icons[mode]"></mat-icon>
            }
            @if (buttonLabel) {
              {{buttonLabel}}
            } @else {
              @if (mode) {
                {{ labels[mode].defaultLabel | customtext : labels[mode].customTextKey | async }}
              } @else {
                Bearbeiten
              }
            }
          </button>
        </mat-card-actions>
      </div>
      @if (mode === 'locked') {
        <img class="done-image" [src]="assetService.getAssetSrc('starterCardDone')"
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
      max-width: 20%;
    }
    button.test-done {
      background-color: transparent;
      color: var(--mat-sys-primary);
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
    locked: 'check'
  };

  labels: Record<string, { defaultLabel: string, customTextKey: string }> = {
    start: {
      defaultLabel: 'Starten',
      customTextKey: 'booklet_starterStartTestButtonLabel'
    },
    continue: {
      defaultLabel: 'Fortsetzen',
      customTextKey: 'booklet_starterContinueTestButtonLabel'
    },
    view: {
      defaultLabel: 'Ansehen',
      customTextKey: 'booklet_starterViewTestButtonLabel'
    },
    locked: {
      defaultLabel: 'Gesperrt',
      customTextKey: 'booklet_starterLockedTestButtonLabel'
    }
  };

  constructor(public assetService: AssetService) { }
}
