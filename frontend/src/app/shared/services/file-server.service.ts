import { Inject, Injectable } from '@angular/core';
import { MainDataService } from '@shared/services/maindata/maindata.service';

@Injectable({
  providedIn: 'root'
})
export class FileServerService {
  constructor(@Inject('FILE_SERVER_URL') private readonly fileServerUrl: string,
              @Inject('BACKEND_URL') private readonly backendUrl: string,
              private mds: MainDataService) { }

  /** Where files and uploaded assets are loaded from: the file-server, or the backend if there is none. */
  getBaseUrl(): string {
    return this.mds.appConfig?.fileServiceUri ? this.fileServerUrl : this.backendUrl;
  }
}
