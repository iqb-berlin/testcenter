import {
  Component, EventEmitter, OnInit, Output
} from '@angular/core';
import { MatListItem, MatSelectionList } from '@angular/material/list';
import { MatButton } from '@angular/material/button';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { BookletReview, Review, UnitReview } from '../../interfaces/test-controller.interfaces';
import { TestControllerService } from '../../services/test-controller.service';
import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'tc-review-list',
  imports: [
    MatListItem,
    MatSelectionList,
    MatButton,
    AsyncPipe
  ],
  template: `
    <!-- wrapper is needed so host component can be "hidden". The host styling 
         "display: flex" may override hidden.-->
    <div class="wrapper">
      <div class="scrollable-area">
        <h3>Kommentare zu dieser Unit</h3>
        <mat-selection-list>
          @for (review of unitReviews$ | async; track review.id) {
            <mat-list-item (click)="editReview.emit(review)">
              {{ review.entry }}
            </mat-list-item>
          }
        </mat-selection-list>
        <h3>alle Kommentare zu diesem Testheft</h3>
        <mat-selection-list>
          @for (review of bookletReviews$ | async; track review.id) {
            <mat-list-item (click)="editReview.emit(review)">
              {{ review.entry }}
            </mat-list-item>
          }
        </mat-selection-list>
      </div>
      <button mat-button class="close-button" (click)="close.emit()">
        Schließen
      </button>
    </div>
  `,
  styles: `
    :host {
      min-height: 0;
      flex: 1;
    }
    .wrapper {
      padding: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .scrollable-area {
      overflow: auto;
    }
    .close-button {
      margin-top: auto;
      align-self: start;
    }
  `
})
export class ReviewListComponent implements OnInit {
  @Output() editReview = new EventEmitter<Review>();
  @Output() close = new EventEmitter<void>();

  unitReviews$: Observable<UnitReview[]> | undefined;
  bookletReviews$: Observable<BookletReview[]> | undefined;
  testID!: string;

  constructor(private backendService: BackendService, private tcs: TestControllerService) { }

  ngOnInit(): void {
    this.testID = this.tcs.testId;
    this.loadReviews();
  }

  loadReviews(): void {
    const unitAlias = this.tcs.currentUnit?.alias;
    this.unitReviews$ = this.backendService.getReviews(this.testID, unitAlias || null) as Observable<UnitReview[]>;
    this.bookletReviews$ = this.backendService.getReviews(this.testID, null) as Observable<BookletReview[]>;
  }
}
