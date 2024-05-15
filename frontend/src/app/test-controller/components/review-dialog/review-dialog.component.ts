import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { ReviewDialogData } from '../../interfaces/test-controller.interfaces';

@Component({
  templateUrl: './review-dialog.component.html',
  styles: [
    '.mat-mdc-radio-group {display: flex; flex-direction: column;}',
    'ul {list-style-type: none; padding: 0;}'
  ]
})
export class ReviewDialogComponent implements OnInit {
  reviewForm = new FormGroup({
    target: new FormControl('u', Validators.required),
    targetLabel: new FormControl(this.data.currentPageLabel),
    priority: new FormControl(''),
    tech: new FormControl(),
    content: new FormControl(),
    design: new FormControl(),
    entry: new FormControl('', Validators.required),
    sender: new FormControl(ReviewDialogComponent.savedName)
  });

  static savedName = '';
  showInputField: boolean = false;
  originalWindowHeight: number = 0;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ReviewDialogData) {
  }

  ngOnInit(): void {
    this.originalWindowHeight = window.innerHeight;
    this.reviewForm.get('target')?.valueChanges.subscribe(value => {
      this.showInputField = value === 'p';
    });
  }

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

  // onKeydown and OnKeyup are needed to detect if the user is using an extended keyboard by measuring the keypress speed
  // it is assumed that keypresses on a physical keyboard are inherently slower on a virtual keyboard, thus the detection
  heightOuter: string = '';
  heightInner: string = '';
  isExtendedKbUsed: boolean | null = null;
  keyPressStart: number = 0;
  keyPressSpeeds: number[] = [];

  onKeydown() {
    this.keyPressStart = new Date().getTime();

    if (this.keyPressSpeeds.length === 10) {
      const sumKeyPressSpeeds = this.keyPressSpeeds.reduce((x: number, y: number) => x + y);
      const averageKeyPressSpeed = sumKeyPressSpeeds / this.keyPressSpeeds.length;

      if (averageKeyPressSpeed < 50) {
        this.isExtendedKbUsed = false;
        this.downsizeTextarea();
      } else {
        this.isExtendedKbUsed = true;
      }
    }
  }

  onKeyup() {
    this.keyPressSpeeds.push(new Date().getTime() - this.keyPressStart);
  }

  onFocus() {
    if (this.isExtendedKbUsed === true) {
      return;
    }
    if (this.isExtendedKbUsed === false) {
      this.downsizeTextarea();
    }
  }

  onBlur() {
    this.heightOuter = this.originalWindowHeight.toString();
    this.heightInner = (this.originalWindowHeight - 50).toString();
  }

  private downsizeTextarea() {
    const sum = this.originalWindowHeight * (1 / 5);
    this.heightOuter = sum.toString();
    this.heightInner = (sum - 30).toString();
  }
}
