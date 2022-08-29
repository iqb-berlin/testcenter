import { Component, OnInit } from '@angular/core';
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
    private bs: BackendService
  ) {
  }

  attachmentData: AttachmentData[];
  seletedAttachment: AttachmentData = null;
  selectedAttachmentImage: ArrayBuffer | string = '';

  displayedColumns: string[] = ['personLabel', 'testLabel', 'unitLabel', 'type', 'lastModified'];

  ngOnInit(): void {
    this.bs.getAttachmentsData([])
      .subscribe(attachmentData => {
        console.log(attachmentData);
        this.attachmentData = attachmentData;
      });
  }

  selectAttachment(element: AttachmentData): void {
    if (this.seletedAttachment?.fileName === element.fileName) {
      this.seletedAttachment = null;
    }
    this.seletedAttachment = element;

    this.bs.getAttachment(`${element.type}:${element.fileName}`)
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
    console.log('DELETE');
  }
}
