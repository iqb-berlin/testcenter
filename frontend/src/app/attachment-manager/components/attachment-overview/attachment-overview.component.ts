import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BackendService } from '../../services/backend/backend.service';
import { AttachmentData } from '../../interfaces/users.interfaces';

@Component({
  templateUrl: './attachment-overview.component.html',
  styleUrls: [
    '../../../../monitor-layout.css',
    './attachment-overview.component.css'
  ]
})
export class AttachmentOverviewComponent implements OnInit {
  constructor(
    private bs: BackendService,
    public snackBar: MatSnackBar
  ) {
  }

  attachmentData: AttachmentData[];
  seletedAttachment: AttachmentData = null;
  selectedAttachmentImage: ArrayBuffer | string = '';

  displayedColumns: string[] = ['personLabel', 'testLabel', 'unitLabel', 'type', 'lastModified'];

  ngOnInit(): void {
    this.loadAttachmentList();
  }

  private loadAttachmentList(): void {
    this.bs.getAttachmentsData([])
      .subscribe(attachmentData => {
        this.attachmentData = attachmentData;
      });
  }

  selectAttachment(element: AttachmentData): void {
    if (this.seletedAttachment?.attachmentId === element.attachmentId) {
      this.seletedAttachment = null;
    }
    this.seletedAttachment = element;

    this.bs.getAttachment(element.attachmentId)
      .subscribe(data => {
        if (element.type === 'image') {
          this.createImageFromBlob(data);
        }
      });
  }

  private createImageFromBlob(image: Blob) {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      () => { this.selectedAttachmentImage = reader.result; },
      false
    );

    if (image) {
      reader.readAsDataURL(image);
    }
  }

  deleteAttachment(): void {
    this.bs.deleteAttachment(this.seletedAttachment.attachmentId)
      .subscribe(ok => {
        if (ok) {
          this.snackBar.open('Anhang gelöscht!', 'Ok.', { duration: 3000 });
          this.loadAttachmentList();
        } else {
          this.snackBar.open('Konnte Anhang nicht löschen!', 'Fehler.', { duration: 3000 });
        }
      });
  }
}
