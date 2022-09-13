import {
  Component, OnInit, ViewChild
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
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
  @ViewChild(MatSort) sort: MatSort;

  selectedAttachmentIndex: number = -1;
  selectedAttachmentImage: ArrayBuffer | string = '';
  selectedAttachmentFileIndex = -1;

  displayedColumns: string[] = ['status', 'personLabel', 'testLabel', 'unitLabel', 'attachmentType', 'lastModified'];
  attachments: MatTableDataSource<AttachmentData>;

  constructor(
    private bs: BackendService,
    public snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.attachments = new MatTableDataSource<AttachmentData>([]);
    this.loadAttachmentList();
  }

  private loadAttachmentList(): void {
    this.bs.getAttachmentsList([])
      .subscribe(attachmentData => {
        this.attachments.data = attachmentData;
        this.attachments.sort = this.sort;
      });
  }

  selectAttachment(index: number): void {
    if (this.selectedAttachmentIndex === index) {
      this.selectedAttachmentIndex = -1;
      this.selectedAttachmentImage = '';
      this.selectedAttachmentFileIndex = -1;
      return;
    }

    this.selectedAttachmentIndex = index;

    if (!this.attachments.data[index].attachmentFileIds.length) {
      return;
    }

    this.selectedAttachmentFileIndex = 0;
    this.loadSelectedAttachment();
  }

  private loadSelectedAttachment(): void {
    this.selectedAttachmentImage = '';
    const selectedAttachment = this.attachments.data[this.selectedAttachmentIndex];
    this.bs.getAttachmentFile(
      selectedAttachment.attachmentId,
      selectedAttachment.attachmentFileIds[this.selectedAttachmentFileIndex]
    )
      .subscribe(data => {
        if (selectedAttachment.dataType === 'image') {
          this.createImageFromBlob(data);
        }
      });
  }

  private createImageFromBlob(image: Blob): void {
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
    const selectedAttachment = this.attachments.data[this.selectedAttachmentIndex];
    this.bs.deleteAttachmentFile(
      selectedAttachment.attachmentId,
      selectedAttachment.attachmentFileIds[this.selectedAttachmentFileIndex]
    )
      .subscribe(ok => {
        if (ok) {
          this.snackBar.open('Anhang gelöscht!', 'Ok.', { duration: 3000 });
          this.selectedAttachmentIndex = null;
          this.selectedAttachmentImage = '';
          this.loadAttachmentList();
        } else {
          this.snackBar.open('Konnte Anhang nicht löschen!', 'Fehler.', { duration: 3000 });
        }
      });
  }

  printPage() {
    this.bs.getAttachmentPage(
      this.attachments.data[this.selectedAttachmentIndex].attachmentId
    );
  }

  nextAttachmentId() {
    this.selectedAttachmentFileIndex +=
      this.selectedAttachmentFileIndex < this.attachments.data[this.selectedAttachmentIndex].attachmentFileIds.length - 1 ?
        1 : 0;
    this.loadSelectedAttachment();
  }

  previousAttachmentId() {
    this.selectedAttachmentFileIndex -= this.selectedAttachmentFileIndex > 0 ? 1 : 0;
    this.loadSelectedAttachment();
  }
}
