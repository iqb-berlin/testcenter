import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { CustomtextPipe } from '@shared/pipes/customtext/customtext.pipe';
import { AsyncPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'tc-page-nav',
  template: `
    <span [style.color]="'white'" [style.padding-right.px]="8">
        {{ ''  | customtext:'login_pagesNaviPrompt' | async }}
    </span>

    <button mat-stroked-button [disabled]="currentPageIndex == 0"
            [attr.data-cy]="'page-navigation-backward'"
            (click)="navPrevious.emit()">
      <i class="material-icons"><</i>
    </button>

    <mat-button-toggle-group [value]="currentPageIndex" [hideSingleSelectionIndicator]="true">
      @for (pageLabel of pageLabels; track $index) {
        <mat-button-toggle [class.selected-value]="currentPageIndex === $index"
                           [matTooltip]="pageLabel"
                           [attr.data-cy]="'page-navigation-' + $index"
                           [value]="$index"
                           (click)="navToPage.emit($index)">
          {{ $index + 1 }}
        </mat-button-toggle>
      }
    </mat-button-toggle-group>

    <button mat-stroked-button [disabled]="currentPageIndex == pageLabels.length - 1"
            [attr.data-cy]="'page-navigation-forward'"
            (click)="navNext.emit()">
      <i class="material-icons">></i>
    </button>
  `,
  imports: [
    CustomtextPipe,
    AsyncPipe,
    MatButton,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatTooltip
  ],
  styles: [`
    .selected-value {
      background-color: var(--accent) !important;
    }

    button {
      height: 34px !important;
      margin-bottom: 2px;
    }

    mat-button-toggle-group {
      height: 34px;
      align-items: center;
    }
  `]
})
export class PageNavBarComponent {
  @Input() pageLabels: string[] = [];
  @Input() currentPageIndex!: number;
  @Output() navPrevious = new EventEmitter();
  @Output() navNext = new EventEmitter();
  @Output() navToPage = new EventEmitter<number>();
}
