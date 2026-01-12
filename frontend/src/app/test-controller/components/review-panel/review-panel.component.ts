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
    <tc-review-form [hidden]="activeView !== 'form'" [review]="selectedReview"
                    (showList)="onShowList()" (close)="close.emit()">
    </tc-review-form>

    <tc-review-list [hidden]="activeView !== 'list'"
                    (editReview)="onEditReview($event)" (close)="close.emit()">
    </tc-review-list>
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
  @ViewChild(ReviewFormComponent) formComponent!: ReviewFormComponent;
  @ViewChild(ReviewListComponent) listComponent!: ReviewListComponent;

  activeView: 'list' | 'form' = 'form';
  selectedReview?: Review;

  protected onShowList() {
    this.listComponent.loadReviews();
    this.activeView = 'list';
  }

  protected onEditReview(review?: Review) {
    this.formComponent.updateFormData(review);
    this.activeView = 'form';
    this.selectedReview = review;
  }
}
