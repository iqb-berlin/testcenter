import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MainDataService } from '../shared/shared.module';
import { BackendService } from './backend.service';
import { ReportType } from './workspace.interfaces';
import { FileService } from '../shared/services/file.service';
import { MessageService } from '../shared/services/message.service';

@Injectable({
  providedIn: 'root'
})

@Injectable()
export class WorkspaceDataService {
  workspaceID!: string; // Initialized on route activation
  wsRole = 'RW';
  wsName = '';

  constructor(private backendService: BackendService,
              private deleteConfirmDialog: MatDialog,
              private mainDataService: MainDataService,
              private messageService: MessageService,
              public snackBar: MatSnackBar) { }

  downloadReport(dataIds: string[], reportType: ReportType, filename: string): void {
    this.mainDataService.showLoadingAnimation();

    this.backendService.getReport(this.workspaceID, reportType, dataIds).subscribe((response: Blob | boolean) => {
      this.mainDataService.stopLoadingAnimation();

      if (response && (response as Blob).size > 0) {
        FileService.saveBlobToFile((response as Blob), filename);
      } else {
        this.messageService.showError('Keine Daten verfügbar.');
      }
    });
  }
}
