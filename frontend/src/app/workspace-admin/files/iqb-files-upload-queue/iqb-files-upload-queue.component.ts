import {
  Component, EventEmitter, OnDestroy, QueryList, ViewChildren, Input, Output
} from '@angular/core';
import { IqbFilesUploadComponent } from '../iqb-files-upload/iqb-files-upload.component';
import { UploadStatus } from '../files.interfaces';

@Component({
    selector: 'tc-files-upload-queue',
    templateUrl: 'iqb-files-upload-queue.component.html',
    styleUrls: ['../iqb-files.scss'],
    standalone: false
})
export class IqbFilesUploadQueueComponent implements OnDestroy {
  @ViewChildren(IqbFilesUploadComponent) fileUploads!: QueryList<IqbFilesUploadComponent>;

  files: Array<File> = [];
  disableClearButton = true;

  @Input() fileAlias: string = '';
  @Input() folderName: string = '';
  @Input() folder: string = '';
  @Output() uploadCompleteEvent = new EventEmitter<IqbFilesUploadQueueComponent>();

  add(file: File): void {
    this.files.push(file);
  }

  removeAll(): void {
    this.files.splice(0, this.files.length);
  }

  ngOnDestroy(): void {
    if (this.files) {
      this.removeAll();
    }
  }

  removeFile(fileToRemove: IqbFilesUploadComponent): void {
    this.files.splice(fileToRemove.id, 1);
  }

  analyseStatus(): void {
    this.disableClearButton = true;
    let someoneisbusy = false;
    let countcomplete = 0;
    this.fileUploads.forEach(fileUpload => {
      if ((fileUpload.status === UploadStatus.ok) || (fileUpload.status === UploadStatus.error)) {
        countcomplete += 1;
      } else if (fileUpload.status === UploadStatus.busy) {
        someoneisbusy = true;
      }
    });

    if (countcomplete === this.fileUploads.length && !someoneisbusy && this.fileUploads.length > 0) {
      this.uploadCompleteEvent.emit();
      this.disableClearButton = false;
    }
  }
}
