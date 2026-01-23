import {
  Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild
} from '@angular/core';
import { skip, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { TestControllerService } from '../../services/test-controller.service';
import { ReviewFormComponent } from './review-form.component';
import { ReviewListComponent } from './review-list.component';
import { Review } from '../../interfaces/test-controller.interfaces';

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
      @if (activeView !== 'form') {
        <button matIconButton [matTooltip]="'Zurück zum Kommentar'" (click)="onBack()">
          <mat-icon>edit</mat-icon>
        </button>
      }
      <button matIconButton [matTooltip]="'Neuer Kommentar'" (click)="onNew()">
        <mat-icon>add_circle</mat-icon>
      </button>
      <button matIconButton [matTooltip]="'Kommentarübersicht'" [disabled]="activeView === 'list'"
              (click)="onShowList()">
        <mat-icon>list_alt</mat-icon>
      </button>
    </mat-toolbar>

    <tc-review-form [hidden]="activeView !== 'form'"
                    (delete)="onDeleteReview()" (close)="close.emit()">
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
    .mat-toolbar {
      flex-shrink: 0;
    }
    .spacer {
      flex: 1 1 auto;
    }
  `
})
export class ReviewPanelComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @ViewChild(ReviewFormComponent) formComponent!: ReviewFormComponent;
  @ViewChild(ReviewListComponent) listComponent!: ReviewListComponent;

  activeView: 'list' | 'form' = 'form';
  editingReview: boolean = false;
  heading: string = `Kommentar ${this.editingReview ? 'bearbeiten' : 'verfassen'}`;
  private isUnitDataDirty: boolean = true;
  private unitChangeSubscription: Subscription | null = null;

  constructor(private tcs: TestControllerService) {}

  ngOnInit(): void {
    this.unitChangeSubscription = this.tcs.currentUnitSequenceId$
      .pipe(
        distinctUntilChanged(),
        skip(1)
      ).subscribe(() => {
        this.isUnitDataDirty = true;
        this.close.emit();
      });
  }

  ngOnDestroy(): void {
    this.unitChangeSubscription?.unsubscribe();
  }

  onOpen(): void {
    if (this.isUnitDataDirty) {
      this.formComponent.resetFormData();
      this.listComponent.loadReviews();
      this.isUnitDataDirty = false;
      this.editingReview = false;
      this.updateHeading();
    }
  }

  protected onShowList() {
    this.listComponent.loadReviews();
    this.activeView = 'list';
    this.updateHeading();
  }

  protected onBack() {
    this.activeView = 'form';
    this.updateHeading();
  }

  protected onNew() {
    this.editingReview = false;
    this.formComponent.newReview();
    this.activeView = 'form';
    this.updateHeading();
  }

  protected onDeleteReview() {
    this.editingReview = false;
    this.onShowList();
  }

  protected onEditReview(review: Review) {
    this.formComponent.editReview(review);
    this.activeView = 'form';
    this.editingReview = true;
    this.updateHeading();
  }

  private updateHeading(): void {
    if (this.activeView === 'form') {
      this.heading = `Kommentar ${this.editingReview ? 'bearbeiten' : 'verfassen'}`;
    } else {
      this.heading = 'Kommentarübersicht';
    }
  }

}