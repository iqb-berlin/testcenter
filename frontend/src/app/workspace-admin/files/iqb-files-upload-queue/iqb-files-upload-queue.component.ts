import {
  Component, EventEmitter, OnDestroy, QueryList, ViewChildren, Input, Output
} from '@angular/core';
import { IqbFilesUploadComponent } from '../iqb-files-upload/iqb-files-upload.component';
import { UploadStatus } from '../files.interfaces';

@Component({
  selector: 'iqb-files-upload-queue',
  templateUrl: 'iqb-files-upload-queue.component.html',
  styleUrls: ['../iqb-files.scss']
})
export class IqbFilesUploadQueueComponent implements OnDestroy {
  @ViewChildren(IqbFilesUploadComponent) fileUploads: QueryList<IqbFilesUploadComponent>;

  files: Array<File> = [];
  disableClearButton = true;

  @Input()
  fileAlias: string;

  @Input()
  folderName: string;

  @Input()
  folder: string;

  @Output()
  uploadCompleteEvent = new EventEmitter<IqbFilesUploadQueueComponent>();

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
    let someoneiscomplete = false;
    let someoneisbusy = false;
    let someoneisready = false;
    this.fileUploads.forEach(fileUpload => {
      if ((fileUpload.status === UploadStatus.ok) || (fileUpload.status === UploadStatus.error)) {
        someoneiscomplete = true;
      } else if (fileUpload.status === UploadStatus.busy) {
        someoneisbusy = true;
      } else if (fileUpload.status === UploadStatus.ready) {
        someoneisready = true;
      }
    });

    if (someoneiscomplete && !someoneisbusy) {
      this.uploadCompleteEvent.emit();
      this.disableClearButton = false;
    }
  }
}
