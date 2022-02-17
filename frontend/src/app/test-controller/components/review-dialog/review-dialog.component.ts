import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, ElementRef, Inject, OnInit } from '@angular/core';
import { ReviewDialogData } from '../../interfaces/test-controller.interfaces';

@Component({
  templateUrl: './review-dialog.component.html'
})
export class ReviewDialogComponent implements OnInit {
  reviewform = new FormGroup({
    target: new FormControl('u', Validators.required),
    priority: new FormControl(''),
    tech: new FormControl(''),
    content: new FormControl(''),
    design: new FormControl(''),
    entry: new FormControl('', Validators.required),
    sender: new FormControl(ReviewDialogComponent.oldName)
  });

  static oldName = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReviewDialogData,
    private element: ElementRef
  ) { }

  ngOnInit(): void {
    const firstInputElement = this.element.nativeElement.querySelector('input');
    if (firstInputElement) {
      firstInputElement.focus();
    }
  }

  getCategories(): string {
    let myreturn = '';
    if (this.reviewform.get('tech').value === true) {
      myreturn = 'tech';
    }
    if (this.reviewform.get('design').value === true) {
      if (myreturn.length > 0) {
        myreturn += ' ';
      }
      myreturn += 'design';
    }
    if (this.reviewform.get('content').value === true) {
      if (myreturn.length > 0) {
        myreturn += ' ';
      }
      myreturn += 'content';
    }
    return myreturn;
  }
}
