import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { MessageDialogData } from '../../interfaces/message-dialog.interfaces';

@Component({
  templateUrl: './wide-message-dialog.component.html',
  styleUrl: './wide-message-dialog.component.css',
  standalone: false
})
export class WideMessageDialogComponent implements OnInit {
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
        break;
      }
    }
    this.msgdata.closebuttonlabel = 'Schließen';
  }
}
