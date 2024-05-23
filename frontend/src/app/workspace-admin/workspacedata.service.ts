import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { BackendService } from './backend.service';
import { ReportType } from './workspace.interfaces';
import { FileService } from '../shared/services/file.service';
import { MessageService } from '../shared/services/message.service';

@Injectable({
  providedIn: 'root'
})

@Injectable()
export class WorkspaceDataService {
  wsRole = 'RW';
  wsName = '';
  workspaceId$: BehaviorSubject<number>;

  get workspaceId(): number {
    return this.workspaceId$.getValue();
  }

  constructor(
    private backendService: BackendService,
    private deleteConfirmDialog: MatDialog,
    private messageService: MessageService,
    public snackBar: MatSnackBar
  ) {
    this.workspaceId$ = new BehaviorSubject<number>(-1);
  }

  downloadReport(dataIds: string[], reportType: ReportType, filename: string, useNewVersion: boolean = false): void {
    this.backendService.getReport(this.workspaceId, reportType, dataIds, useNewVersion)
      .subscribe((response: Blob) => {
        if (response.size > 0) {
          FileService.saveBlobToFile(response, filename);
        } else {
          this.messageService.showError('Keine Daten verfügbar.');
        }
      });
  }
}
