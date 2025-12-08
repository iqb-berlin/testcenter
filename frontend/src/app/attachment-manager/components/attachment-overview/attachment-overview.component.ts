import {
  Component, OnInit, ViewChild
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { BackendService } from '../../services/backend/backend.service';
import { AttachmentData, AttachmentType } from '../../interfaces/users.interfaces';
import { FileService } from '../../../shared/services/file.service';
import { CustomtextService } from '../../../shared/services/customtext/customtext.service';

@Component({
    templateUrl: './attachment-overview.component.html',
    styleUrls: [
        '../attachment-manager/monitor-layout.css',
        './attachment-overview.component.css'
    ],
    standalone: false
})
export class AttachmentOverviewComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('sidenav', { static: true }) sidenav!: MatSidenav;

  selectedAttachmentIndex: number = -1;
  selectedAttachmentImage: ArrayBuffer | string | null = '';
  selectedAttachmentFileIndex = -1;

  displayedColumns: string[] = [
    'status', 'personLabel', 'testLabel', 'unitLabel', 'variableId', 'attachmentType', 'lastModified'
  ];

  attachments: MatTableDataSource<AttachmentData>;
  attachmentTypes: AttachmentType[] = [];

  mobileView: boolean = false;

  constructor(
    private bs: BackendService,
    public snackBar: MatSnackBar,
    private breakpointObserver: BreakpointObserver,
    private customTextService: CustomtextService
  ) {
    this.attachments = new MatTableDataSource<AttachmentData>([]);
  }

  ngOnInit(): void {
    this.loadAttachmentList();
    this.breakpointObserver
      .observe([
        Breakpoints.Medium,
        Breakpoints.Small,
        Breakpoints.XSmall
      ])
      .subscribe(result => {
        if (result.matches) {
          this.sidenav.close();
          this.mobileView = true;
        } else {
          this.sidenav.open();
          this.mobileView = false;
        }
      });
  }

  private loadAttachmentList(): void {
    this.bs.getAttachmentsList([])
      .subscribe(attachmentData => {
        this.attachments.data = attachmentData;
        this.attachments.sort = this.sort;
        this.attachmentTypes =
          attachmentData
            .reduce(
              (agg, item) => {
                if (!agg.includes(item.attachmentType)) {
                  agg.push(item.attachmentType);
                }
                return agg;
              },
              <AttachmentType[]>[]
            );
      });
  }

  selectAttachment(index: number): void {
    this.selectedAttachmentImage = '';
    this.sidenav.open();

    this.selectedAttachmentIndex = index;
    this.selectedAttachmentFileIndex = 0;

    if (this.attachments.data[index]?.attachmentFileIds.length) {
      this.loadSelectedAttachment();
    }
  }

  private loadSelectedAttachment(): void {
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
          this.selectedAttachmentIndex = -1;
          this.selectedAttachmentImage = '';
          this.loadAttachmentList();
        } else {
          this.snackBar.open('Konnte Anhang nicht löschen!', 'Fehler.', { duration: 3000 });
        }
      });
  }

  downloadPageTemplate(): void {
    this.bs.getAttachmentPage(
      this.attachments.data[this.selectedAttachmentIndex].attachmentId,
      this.customTextService.getCustomText('am_page_template_label')
    )
      .subscribe(pdf => { FileService.saveBlobToFile(pdf, 'Anhänge.pdf'); });
  }

  nextAttachmentId(): void {
    this.selectedAttachmentFileIndex +=
      this.selectedAttachmentFileIndex < this.attachments.data[this.selectedAttachmentIndex].attachmentFileIds.length - 1 ?
        1 : 0;
    this.loadSelectedAttachment();
  }

  previousAttachmentId(): void {
    this.selectedAttachmentFileIndex -= this.selectedAttachmentFileIndex > 0 ? 1 : 0;
    this.loadSelectedAttachment();
  }

  sidebarClick(): void {
    if (this.sidenav.opened) {
      this.sidenav.close();
    } else {
      this.sidenav.open()
        .then(() => this.selectAttachment(-1));
    }
  }

  addClick(): void {
    this.selectAttachment(-1);
    this.sidenav.open();
  }

  downloadAllPageTemplates(): void {
    this.bs.getAttachmentPages(
      this.customTextService.getCustomText('am_page_template_label') ?? ''
    )
      .subscribe(pdf => { FileService.saveBlobToFile(pdf, 'Anhänge.pdf'); });
  }
}
