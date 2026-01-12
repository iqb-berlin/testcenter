import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { ReviewFormComponent } from './review-form.component';
import { ReviewListComponent } from './review-list.component';
import { Review } from '../../interfaces/test-controller.interfaces';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'tc-review-panel',
  imports: [
    ReviewFormComponent,
    ReviewListComponent,
    MatIcon,
    MatIconButton,
    MatToolbar,
    MatTooltip
  ],
  template: `
    <mat-toolbar>
      <h2 data-cy="comment-diag-title">{{ heading }}</h2>
      <span class="example-spacer"></span>
      <span class="spacer"></span>
      <button matIconButton [matTooltip]="'Neuer Kommentar'" (click)="onEditReview()">
        <mat-icon>add_circle</mat-icon>
      </button>
      <button matIconButton [matTooltip]="'Kommentarübersicht'" [disabled]="activeView === 'list'" 
              (click)="onShowList()">
        <mat-icon>list_alt</mat-icon>
      </button>
    </mat-toolbar>

    <tc-review-form [hidden]="activeView !== 'form'" [review]="selectedReview"
                    (showList)="onShowList()" (close)="close.emit()">
    </tc-review-form>

    <tc-review-list [hidden]="activeView !== 'list'"
                    (editReview)="onEditReview($event)" (close)="close.emit()">
    </tc-review-list>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .spacer {
      flex: 1 1 auto;
    }
  `
})
export class ReviewPanelComponent {
  @Output() close = new EventEmitter<void>();
  @ViewChild(ReviewFormComponent) formComponent!: ReviewFormComponent;
  @ViewChild(ReviewListComponent) listComponent!: ReviewListComponent;

  activeView: 'list' | 'form' = 'form';
  selectedReview?: Review;
  heading: string = `Kommentar ${ this.selectedReview ? 'bearbeiten' : 'verfassen'}`;

  protected onShowList() {
    this.listComponent.loadReviews();
    this.activeView = 'list';
    this.updateHeading();
  }

  protected onEditReview(review?: Review) {
    this.formComponent.updateFormData(review);
    this.activeView = 'form';
    this.selectedReview = review;
    this.updateHeading();
  }

  private updateHeading(): void {
    if (this.activeView === 'form') {
      this.heading = `Kommentar ${ this.selectedReview ? 'bearbeiten' : 'verfassen'}`;
    } else {
      this.heading = 'Kommentarübersicht';
    }
  }
}
