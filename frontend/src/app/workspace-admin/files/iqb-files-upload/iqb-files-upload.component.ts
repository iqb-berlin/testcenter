import {
  Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output
} from '@angular/core';
import { Subscription } from 'rxjs';
import { BackendService } from '../../backend.service';
import { UploadReport, UploadStatus } from '../files.interfaces';
import { WorkspaceDataService } from '../../workspacedata.service';

@Component({
  selector: 'iqb-files-upload',
  templateUrl: './iqb-files-upload.component.html',
  styleUrls: ['../iqb-files.scss']
})
export class IqbFilesUploadComponent implements OnInit, OnDestroy {
  @HostBinding('class') myclass = 'iqb-files-upload';

  constructor(
    private bs: BackendService,
    public wds: WorkspaceDataService
  ) { }

  private _status: UploadStatus;
  get status(): UploadStatus {
    return this._status;
  }

  set status(newstatus: UploadStatus) {
    this._status = newstatus;
    this.statusChangedEvent.emit(this);
  }

  private requestResponse: UploadReport;
  get uploadResponse(): UploadReport {
    switch (this._status) {
      case UploadStatus.busy:
        return { '': { info: ['Bitte warten'] } };
      case UploadStatus.ready:
        return { '': { info: ['Bereit'] } };
      default:
        return this.requestResponse;
    }
  }

  /* Http request input bindings */

  @Input()
  fileAlias = 'file';

  @Input()
  folderName = '';

  @Input()
  folder = '';

  @Input()
  get file(): File {
    return this._file;
  }

  set file(file: File) {
    this._file = file;
    this._filedate = this._file.lastModified;
  }

  @Input()
  set id(id: number) {
    this._id = id;
  }

  get id(): number {
    return this._id;
  }

  @Output() removeFileRequestEvent = new EventEmitter<IqbFilesUploadComponent>();
  @Output() statusChangedEvent = new EventEmitter<IqbFilesUploadComponent>();

  progressPercentage = 0;
  private _file: File;
  private _filedate = 0;
  private _id: number;
  private fileUploadSubscription: Subscription;

  ngOnInit(): void {
    this._status = UploadStatus.ready;
    this.requestResponse = {};
    this.upload();
  }

  upload(): void {
    if (this.status !== UploadStatus.ready) {
      return;
    }

    this.status = UploadStatus.busy;
    const formData = new FormData();
    formData.set(this.fileAlias, this._file, this._file.name);
    if ((typeof this.folderName !== 'undefined') && (typeof this.folder !== 'undefined')) {
      if (this.folderName.length > 0) {
        formData.append(this.folderName, this.folder);
      }
    }

    this.fileUploadSubscription = this.bs.uploadFile(this.wds.wsId, formData)
      .subscribe(res => {
        this.requestResponse = res.report;
        this.status = res.status;
        this.progressPercentage = res.progress;
      });
  }

  remove(): void {
    if (this.fileUploadSubscription) {
      this.fileUploadSubscription.unsubscribe();
    }
    this.removeFileRequestEvent.emit(this);
  }

  ngOnDestroy(): void {
    if (this.fileUploadSubscription) {
      this.fileUploadSubscription.unsubscribe();
    }
  }
}
