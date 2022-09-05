import {
  Component, OnInit, ViewChild
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { BackendService } from '../../services/backend/backend.service';
import { AttachmentData, AttachmentType } from '../../interfaces/users.interfaces';

@Component({
  templateUrl: './attachment-overview.component.html',
  styleUrls: [
    '../../../../monitor-layout.css',
    './attachment-overview.component.css'
  ]
})
export class AttachmentOverviewComponent implements OnInit {
  @ViewChild(MatSort) sort: MatSort;

  selectedAttachment: AttachmentData = null;
  selectedAttachmentImage: ArrayBuffer | string = '';

  displayedColumns: string[] = ['personLabel', 'testLabel', 'unitLabel', 'attachmentType', 'lastModified'];
  dataSource: MatTableDataSource<AttachmentData>;

  constructor(
    private bs: BackendService,
    public snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<AttachmentData>([]);
    this.loadAttachmentList();
  }

  private loadAttachmentList(): void {
    this.bs.getAttachmentsData([])
      .subscribe(attachmentData => {
        this.dataSource.data = attachmentData;
        this.dataSource.sort = this.sort;
      });
  }

  selectAttachment(element: AttachmentData): void {
    if (this.selectedAttachment?.attachmentId === element.attachmentId) {
      this.selectedAttachment = null;
      this.selectedAttachmentImage = '';
      return;
    }
    console.log(element);
    this.selectedAttachment = element;

    if (element.dataType === 'missing') {
      return;
    }

    this.bs.getAttachment(element.attachmentId)
      .subscribe(data => {
        if (element.dataType === 'image') {
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
    this.bs.deleteAttachment(this.selectedAttachment.attachmentId)
      .subscribe(ok => {
        if (ok) {
          this.snackBar.open('Anhang gelöscht!', 'Ok.', { duration: 3000 });
          this.selectedAttachment = null;
          this.selectedAttachmentImage = '';
          this.loadAttachmentList();
        } else {
          this.snackBar.open('Konnte Anhang nicht löschen!', 'Fehler.', { duration: 3000 });
        }
      });
  }

  printPage(attachmentData: AttachmentData) {
    this.bs.getAttachmentPage(attachmentData.attachmentId);
  }
}
