import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReviewFormComponent } from './review-form.component';
import { ReviewListComponent } from './review-list.component';
import { Review } from '../../interfaces/test-controller.interfaces';

@Component({
  selector: 'tc-review-panel',
  imports: [
    ReviewFormComponent,
    ReviewListComponent
  ],
  template: `
    @if (activeView == 'form') {
      <tc-review-form [review]="selectedReview"
                      (showList)="onShowList()" (close)="close.emit()">
      </tc-review-form>
    } @else {
      <tc-review-list [testID]="testID" [unitAlias]="unitAlias"
                      (editReview)="onEditReview($event)" (close)="close.emit()">
      </tc-review-list>
    }
  `,
  styles: `
    :host ::ng-deep .view-switch-button {
      align-self: center;
      padding: 0 30px;
    }
  `
})
export class ReviewPanelComponent {
  @Output() close = new EventEmitter<void>();

  activeView: 'list' | 'form' = 'form';
  selectedReview?: Review;

  protected onShowList() {
    this.activeView = 'list';
  }

  protected onEditReview(review?: Review) {
    this.activeView = 'form';
    this.selectedReview = review;
  }
}
