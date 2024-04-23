import {
  Component, EventEmitter, Input, Output
} from '@angular/core';

@Component({
  selector: 'tc-page-nav',
  template: `
    <span [style.color]="'white'" [style.padding-right.px]="8">
        {{ ''  | customtext:'login_pagesNaviPrompt' | async}}
    </span>

    <button mat-stroked-button [disabled]="currentPageIndex == 0"
                       (click)="navPrevious.emit()">
      <i class="material-icons">chevron_left</i>
    </button>

    <mat-button-toggle-group [value]="currentPageIndex">
      <mat-button-toggle *ngFor="let pageLabel of pageLabels; let index = index"
                         [class.selected-value]="currentPageIndex === index"
                         [matTooltip]="pageLabel"
                         [attr.data-cy]="'page-navigation-' + index"
                         [value]="index"
                         (click)="navToPage.emit(index)">
        {{ index + 1 }}
      </mat-button-toggle>
    </mat-button-toggle-group>

    <button mat-stroked-button [disabled]="currentPageIndex == pageLabels.length - 1"
            (click)="navNext.emit()">
      <i class="material-icons">chevron_right</i>
    </button>
  `,
  styles: [`
    .selected-value {background-color: var(--accent) !important;}
    button { height: 34px !important; margin-bottom: 2px;}
    mat-button-toggle-group {height: 34px; align-items: center;}
  `]
})
export class PageNavBarComponent {
  @Input() pageLabels: string[] = [];
  @Input() currentPageIndex!: number;
  @Output() navPrevious = new EventEmitter();
  @Output() navNext = new EventEmitter();
  @Output() navToPage = new EventEmitter<number>();
}
