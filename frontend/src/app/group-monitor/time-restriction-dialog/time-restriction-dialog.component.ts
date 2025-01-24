import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';

export interface TimeRestrictionDialogData {
  title: string;
  content: string;
  remainingTime: number;
  confirmbuttonlabel: string;
  showcancel: boolean;
  cancelbuttonlabel: string;
}

@Component({
  selector: 'time-restriction-dialog',
  templateUrl: './time-restriction-dialog.component.html',
  styleUrls: ['./time-restriction-dialog.component.css']
})
export class TimeRestrictionDialogComponent implements OnInit {
  showcancel: boolean = true;
  setTime = new FormControl(0);

  constructor(@Inject(MAT_DIALOG_DATA) public dialogData: TimeRestrictionDialogData) {}

  ngOnInit() {
    if ((typeof this.dialogData.title === 'undefined') || (this.dialogData.title.length === 0)) {
      this.dialogData.title = 'Bitte bestätigen!';
    }
    if (
      (typeof this.dialogData.confirmbuttonlabel === 'undefined') ||
      (this.dialogData.confirmbuttonlabel.length === 0)
    ) {
      this.dialogData.confirmbuttonlabel = 'Bestätigen';
    }
    if (!this.dialogData.showcancel) {
      this.showcancel = false;
    }
    if (
      (typeof this.dialogData.cancelbuttonlabel === 'undefined') ||
      (this.dialogData.cancelbuttonlabel.length === 0)
    ) {
      this.dialogData.cancelbuttonlabel = 'Abbrechen';
    }
  }
}
