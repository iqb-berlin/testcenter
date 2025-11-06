import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { MessageDialogData } from '../../interfaces/message-dialog.interfaces';

@Component({
    templateUrl: './message-dialog.component.html',
    styles: [
        '.mdc-dialog__title::before { height: auto; }'
    ],
    standalone: false
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
