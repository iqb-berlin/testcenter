import {Component, EventEmitter, Input, OnInit, Output, HostBinding, OnDestroy} from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders, HttpParams,
  HttpEvent } from '@angular/common/http';


@Component({
    selector: 'iqb-files-upload',
    templateUrl: `./iqbFilesUpload.component.html`,
    exportAs: 'iqbFilesUpload',
    styleUrls: ['../iqb-files.scss'],
  })

  export class IqbFilesUploadComponent implements OnInit, OnDestroy {
    @HostBinding('class') myclass = 'iqb-files-upload';

    constructor(
      private myHttpClient: HttpClient) { }

    // ''''''''''''''''''''''''
    private _status: UploadStatus;
    get status(): UploadStatus {
      return this._status;
    }

    set status(newstatus: UploadStatus) {
      this._status = newstatus;
      this.statusChangedEvent.emit(this);
    }

    // ''''''''''''''''''''''''
    private requestResponseText: string;
    get statustext(): string {
      let myreturn;
      switch (this._status) {
        case UploadStatus.busy: {
          myreturn = 'Bitte warten';
          break;
        }
        case UploadStatus.ready: {
          myreturn = 'Bereit';
          break;
        }
        default: {
          myreturn = this.requestResponseText;
          break;
        }
      }
      return myreturn;
    }

    /* Http request input bindings */
    @Input()
    httpUrl = 'http://localhost:8080';

    @Input()
    httpRequestHeaders: HttpHeaders | {
      [header: string]: string | string[];
    } = new HttpHeaders().set('Content-Type', 'multipart/form-data');

    @Input()
    httpRequestParams: HttpParams | {
      [param: string]: string | string[];
    } = new HttpParams();

    @Input()
    fileAlias = 'file';

    @Input()
    tokenName = '';

    @Input()
    token = '';

    @Input()
    folderName = '';

    @Input()
    folder = '';

    @Input()
    get file(): any {
      return this._file;
    }
    set file(file: any) {
      this._file = file;
      this._filedate = this._file.lastModified;
      this.total = this._file.size;
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

    private progressPercentage = 0;
    public loaded = 0;
    private total = 0;
    private _file: any;
    private _filedate = '';
    private _id: number;
    private fileUploadSubscription: any;


    ngOnInit() {
      this._status = UploadStatus.ready;
      this.requestResponseText = '';
      this.upload();
    }

    // ==================================================================
    private upload(): void {
      if (this.status === UploadStatus.ready) {

        this.status = UploadStatus.busy;
        const formData = new FormData();
        formData.set(this.fileAlias, this._file, this._file.name);
        if ((typeof this.tokenName !== 'undefined') && (typeof this.token !== 'undefined')) {
          if (this.tokenName.length > 0) {
            formData.append(this.tokenName, this.token);
          }
        }
        if ((typeof this.folderName !== 'undefined') && (typeof this.folder !== 'undefined')) {
          if (this.folderName.length > 0) {
            formData.append(this.folderName, this.folder);
          }
        }
        this.fileUploadSubscription = this.myHttpClient.post(this.httpUrl, formData, {
        // headers: this.httpRequestHeaders,
          observe: 'events',
          params: this.httpRequestParams,
          reportProgress: true,
          responseType: 'json'
        }).subscribe((event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.progressPercentage = Math.floor( event.loaded * 100 / event.total );
            this.loaded = event.loaded;
            this.total = event.total;
            this.status = UploadStatus.busy;
          } else if (event.type === HttpEventType.Response) {
            this.requestResponseText = event.body;
            if ((this.requestResponseText.length > 5) && (this.requestResponseText.substr(0, 2) === 'e:')) {
              this.requestResponseText = this.requestResponseText.substr(2);
              this.status = UploadStatus.error;
            } else {
              this.status = UploadStatus.ok;
              this.remove();
            }
          }
        }, () => {
          if (this.fileUploadSubscription) {
            this.fileUploadSubscription.unsubscribe();
          }

          this.status = UploadStatus.error;
        });
      }
    }

    // ==================================================================
    public remove(): void {
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

export enum UploadStatus {
  ready,
  busy,
  ok,
  error
}
