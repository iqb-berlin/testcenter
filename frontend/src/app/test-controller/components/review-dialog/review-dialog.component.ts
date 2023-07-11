import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { ReviewDialogData } from '../../interfaces/test-controller.interfaces';

@Component({
  templateUrl: './review-dialog.component.html',
  styles: [
    '.mat-mdc-radio-group {display: flex; flex-direction: column;}',
    'ul {list-style-type: none; padding: 0;}'
  ]
})
export class ReviewDialogComponent {
  reviewForm = new FormGroup({
    target: new FormControl('u', Validators.required),
    priority: new FormControl(''),
    tech: new FormControl(),
    content: new FormControl(),
    design: new FormControl(),
    entry: new FormControl('', Validators.required),
    sender: new FormControl(ReviewDialogComponent.savedName)
  });

  static savedName = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: ReviewDialogData) { }

  getSelectedCategories(): string { // TODO wtf is this a string
    let selectedCategories = '';
    if (this.reviewForm.get('tech')?.value === true) {
      selectedCategories = 'tech';
    }
    if (this.reviewForm.get('design')?.value === true) {
      selectedCategories += ' design';
    }
    if (this.reviewForm.get('content')?.value === true) {
      selectedCategories += ' content';
    }
    return selectedCategories;
  }
}
