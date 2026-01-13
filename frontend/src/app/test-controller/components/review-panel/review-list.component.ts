import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatListItem, MatSelectionList } from '@angular/material/list';
import { MatButton } from '@angular/material/button';
import { BackendService } from '../../services/backend.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { BookletReview, Review, UnitReview } from '../../interfaces/test-controller.interfaces';
import { TestControllerService } from '../../services/test-controller.service';

@Component({
  selector: 'tc-review-list',
  imports: [
    MatListItem,
    MatSelectionList,
    MatButton,
    AsyncPipe
  ],
  template: `
    <div class="wrapper">
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
      <button mat-button class="close-button" (click)="close.emit()">
        Schließen
      </button>
    </div>
  `,
  styles: `
    .wrapper {
      padding: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .close-button {
      margin-top: auto;
      align-self: start;
    }
  `,
})
export class ReviewListComponent implements OnInit {
  @Output() editReview = new EventEmitter<Review>();
  @Output() close = new EventEmitter<void>();

  unitReviews$: Observable<UnitReview[]> | undefined;
  bookletReviews$: Observable<BookletReview[]> | undefined;
  testID!: string;
  unitAlias?: string | null = null;

  constructor(private backendService: BackendService, private tcs: TestControllerService) { }

  ngOnInit(): void {
    this.testID = this.tcs.testId;
    this.unitAlias = this.tcs.currentUnit?.alias;
    this.loadReviews();
  }

  loadReviews(): void {
    this.unitReviews$ = this.backendService.getReviews(this.testID, this.unitAlias || null) as Observable<UnitReview[]>;
  }
}
