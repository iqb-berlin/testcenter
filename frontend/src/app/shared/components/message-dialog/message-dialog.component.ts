import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { MatButton } from '@angular/material/button';
import { MessageDialogData } from '../../interfaces/message-dialog.interfaces';

@Component({
  templateUrl: './message-dialog.component.html',
  imports: [
    AlertComponent,
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    MatButton,
    MatDialogClose
  ],
  styles: [
    '.mdc-dialog__title::before { height: auto; }'
  ]
})
export class MessageDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public msgdata: MessageDialogData) { }

  ngOnInit(): void {
    switch (this.msgdata.type) {
    case 'error': {
      this.msgdata.title = 'Achtung: Fehler';
      break;
    }
    case 'warning': {
      this.msgdata.title = 'Achtung: Warnung';
      break;
    }
    default: {
      this.msgdata.title = 'Hinweis';
      break;
    }
    }
    this.msgdata.closebuttonlabel = 'Schließen';
  }
}
