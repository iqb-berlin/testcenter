import { Component } from '@angular/core';
import {
  FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MainDataService } from '../../../shared/services/maindata/maindata.service';
import { AppError } from '../../../app.interfaces';
import { TestControllerService } from '../../services/test-controller.service';
import { BackendService } from '../../services/backend.service';
import { UserAgentService } from '../../../shared/shared.module';

@Component({
  selector: 'tc-review-panel',
  imports: [
    MatCheckbox,
    MatFormField,
    MatInput,
    MatLabel,
    MatRadioButton,
    MatRadioGroup,
    ReactiveFormsModule,
    MatTooltipModule,
    MatButton,
    CdkTextareaAutosize
  ],
  templateUrl: './review-panel.component.html',
  styleUrl: './review-panel.component.css'
})
export class ReviewPanelComponent {
  reviewForm: FormGroup;
  senderName?: string;
  accountName: string;
  bookletname?: string;
  unitTitle?: string;
  unitAlias?: string;

  constructor(private tcs: TestControllerService, private mainDataService: MainDataService,
              private bs: BackendService, private snackBar: MatSnackBar) {
    this.reviewForm = new FormGroup({
      target: new FormControl('unit', Validators.required),
      targetLabel: new FormControl((this.tcs.currentUnit?.pageLabels[this.tcs.currentUnit.state.CURRENT_PAGE_ID || ''])),
      priority: new FormControl(''),
      tech: new FormControl(),
      content: new FormControl(),
      design: new FormControl(),
      entry: new FormControl('', Validators.required),
      sender: new FormControl(this.senderName)
    });
    const authData = this.mainDataService.getAuthData();
    if (!authData) {
      throw new AppError({ description: '', label: 'Nicht Angemeldet!' }); // necessary?!
    }
    this.accountName = authData.displayName;
    this.bookletname = this.tcs.booklet?.metadata.label;
    this.unitTitle = this.tcs.currentUnit?.label;
    this.unitAlias = this.tcs.currentUnit?.alias;
  }

  saveReview(): void {
    const result = this.reviewForm.value;
    const currentPageIndex = this.tcs.currentUnit?.state.CURRENT_PAGE_NR;
    const currentPageLabel = this.tcs.currentUnit?.pageLabels[this.tcs.currentUnit.state.CURRENT_PAGE_ID || ''];
    this.bs.saveReview(
      this.tcs.testId,
      (result.target === 'unit' || result.target === 'task') ? (this.unitAlias as string) : null,
      (result.target === 'task') ? currentPageIndex || null : null,
      (result.target === 'task') ? currentPageLabel || null : null,
      result.priority,
      this.getSelectedCategories(),
      result.sender ? `${result.sender}: ${result.entry}` : result.entry,
      UserAgentService.outputWithOs(),
      this.tcs.currentUnit?.id || ''
    ).subscribe(() => {
      this.snackBar.open('Kommentar gespeichert', '', {
        duration: 5000,
        panelClass: ['snackbar-comment-saved']
      });
    });
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
}
