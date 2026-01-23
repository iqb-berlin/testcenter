import {
  Component, EventEmitter, Output, ViewChild
} from '@angular/core';
import {
  FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators
} from '@angular/forms';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { MainDataService } from '../../../shared/services/maindata/maindata.service';
import { AppError } from '../../../app.interfaces';
import { TestControllerService } from '../../services/test-controller.service';
import { BackendService } from '../../services/backend.service';
import { UserAgentService } from '../../../shared/shared.module';
import { isUnitReview, Review } from '../../interfaces/test-controller.interfaces';

@Component({
  selector: 'tc-review-form',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatButton,
    MatRadioGroup,
    MatInput,
    MatRadioButton,
    CdkTextareaAutosize,
    MatLabel,
    MatTooltip,
    MatCheckbox
  ],
  templateUrl: './review-form.component.html',
  styleUrl: './review-form.component.css'
})
export class ReviewFormComponent {
  @Output() delete = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @ViewChild(FormGroupDirective) private formDir!: FormGroupDirective;

  reviewForm: FormGroup;
  isEditingReview = false;
  editedReview?: Review;
  isUnitReview?: boolean;

  accountName: string;
  bookletname?: string;
  unitTitle?: string;
  unitAlias?: string;

  REVIEW_FORM_DEFAULTS = {
    target: 'unit',
    targetLabel: '',
    priority: 0,
    entry: '',
    reviewer: undefined
  };

  constructor(private tcs: TestControllerService, private mainDataService: MainDataService,
              private backendService: BackendService, private snackBar: MatSnackBar) {
    const authData = this.mainDataService.getAuthData();
    if (!authData) {
      throw new AppError({ description: '', label: 'Nicht Angemeldet!' }); // TODO necessary?!
    }
    this.accountName = authData.displayName;
    this.bookletname = this.tcs.booklet?.metadata.label;
    this.updateUnitRefs();
    this.reviewForm = new FormGroup({
      target: new FormControl(this.REVIEW_FORM_DEFAULTS.target, Validators.required),
      targetLabel: new FormControl(this.REVIEW_FORM_DEFAULTS.targetLabel),
      priority: new FormControl(this.REVIEW_FORM_DEFAULTS.priority),
      tech: new FormControl(),
      content: new FormControl(),
      design: new FormControl(),
      entry: new FormControl(this.REVIEW_FORM_DEFAULTS.entry, Validators.required),
      reviewer: new FormControl(this.REVIEW_FORM_DEFAULTS.reviewer)
    });
  }

  updateUnitRefs(): void {
    this.unitTitle = this.tcs.currentUnit?.label;
    this.unitAlias = this.tcs.currentUnit?.alias;
  }

  private updateFormData(existingReview: Review): void {
    this.reviewForm.patchValue({
      target: isUnitReview(existingReview) ? (existingReview.pagelabel ? 'task' : 'unit') : 'booklet',
      reviewer: existingReview.reviewer,
      targetLabel: isUnitReview(existingReview) ? existingReview.pagelabel : this.REVIEW_FORM_DEFAULTS.targetLabel,
      priority: existingReview.priority,
      tech: existingReview.categories.includes('tech'),
      content: existingReview.categories.includes('content'),
      design: existingReview.categories.includes('design'),
      entry: existingReview.entry
    });
  }

  resetFormData(): void {
    this.updateUnitRefs();
    this.isEditingReview = false;
    this.editedReview = undefined;
    this.formDir.reset({
      ...this.REVIEW_FORM_DEFAULTS
    });
  }

  newReview(): void {
    this.resetFormData();
    this.isEditingReview = false;
    this.editedReview = undefined;
  }

  editReview(review: Review) {
    this.updateFormData(review);
    this.isEditingReview = true;
    this.isUnitReview = isUnitReview(review);
    this.editedReview = review;
  }

  saveReview(): void {
    const result = this.reviewForm.value;
    // PAGE_NR seems to be broken and is always null
    const currentPageIndex = this.tcs.currentUnit?.state.CURRENT_PAGE_ID;
    if (!this.editedReview) {
      this.backendService.saveReview(
        this.tcs.testId,
        (result.target === 'unit' || result.target === 'task') ? (this.unitAlias as string) : null,
        (result.target === 'task') ? Number(currentPageIndex) || null : null,
        (result.target === 'task') ? result.targetLabel : null,
        result.priority,
        this.getSelectedCategories(),
        result.entry,
        result.reviewer || null,
        UserAgentService.outputWithOs(),
        this.tcs.currentUnit?.id || ''
      ).subscribe(() => {
        this.snackBar.open('Kommentar gespeichert', '', {
          duration: 5000,
          panelClass: ['snackbar-comment-saved']
        });
        this.formDir.resetForm({
          reviewer: this.reviewForm.get('reviewer')?.value,
          target: this.reviewForm.get('target')?.value,
          targetLabel: this.reviewForm.get('targetLabel')?.value
        });
      });
    } else {
      this.backendService.updateReview(
        this.tcs.testId,
        (result.target === 'unit' || result.target === 'task') ? (this.unitAlias as string) : null,
        this.editedReview.id,
        result.priority,
        this.getSelectedCategories(),
        result.entry,
        result.reviewer || null,
        (this.reviewForm.value.target === 'task') ? result.targetLabel : null
      ).subscribe(() => {
        this.snackBar.open('Kommentar geändert', '', {
          duration: 5000,
          panelClass: ['snackbar-comment-saved']
        });
      });
    }
    this.close.emit();
  }

  getSelectedCategories(): string { // TODO wtf is this a string
    let selectedCategories = '';
    if (this.reviewForm.get('tech')?.value === true) {
      selectedCategories = ' tech';
    }
    if (this.reviewForm.get('design')?.value === true) {
      selectedCategories += ' design';
    }
    if (this.reviewForm.get('content')?.value === true) {
      selectedCategories += ' content';
    }
    return selectedCategories.trim();
  }

  protected deleteReview() {
    this.backendService.deleteReview(
      this.tcs.testId,
      this.reviewForm.value.target !== 'booklet' ? (this.unitAlias || null) : null,
      this.editedReview!.id
    ).subscribe(
      () => {
        this.snackBar.open('Kommentar gelöscht', '', {
          duration: 5000,
          panelClass: ['snackbar-comment-saved']
        });
        this.newReview();
        this.delete.emit();
      }
    );
  }
}
