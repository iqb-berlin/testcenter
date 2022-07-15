import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MainDataService } from '../shared/shared.module';
import { BackendService } from './backend.service';
import { ReportType } from './workspace.interfaces';
import { FileService } from '../shared/services/file.service';

@Injectable({
  providedIn: 'root'
})

@Injectable()
export class WorkspaceDataService {
  wsId: string;
  wsRole = 'RW';
  wsName = '';

  constructor(
    private backendService: BackendService,
    private deleteConfirmDialog: MatDialog,
    private mainDataService: MainDataService,
    public snackBar: MatSnackBar
  ) { }

  downloadReport(dataIds: string[], reportType: ReportType, filename: string): void {
    this.mainDataService.showLoadingAnimation();

    this.backendService.getReport(this.wsId, reportType, dataIds).subscribe(response => {
      const errorMessage: string = 'Keine Daten verfügbar.';
      const errorType: string = 'Fehler';
      const errorDisplayDuration: number = 3000;

      this.mainDataService.stopLoadingAnimation();

      if (response === false) {
        this.snackBar.open(errorMessage, errorType, { duration: errorDisplayDuration });
      } else {
        const reportData = response as Blob;
        if (reportData.size > 0) {
          FileService.saveBlobToFile(reportData, filename);
        } else {
          this.snackBar.open(errorMessage, errorType, { duration: errorDisplayDuration });
        }
      }
    });
  }
}
