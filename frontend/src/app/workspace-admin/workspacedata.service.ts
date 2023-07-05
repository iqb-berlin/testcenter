import { Injectable } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';
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

  downloadReport(dataIds: string[], reportType: ReportType, filename: string): void {
    this.backendService.getReport(this.workspaceId, reportType, dataIds)
      .subscribe((response: Blob) => {
        if (response.size > 0) {
          FileService.saveBlobToFile(response, filename);
        } else {
          this.messageService.showError('Keine Daten verfügbar.');
        }
      });
  }
}
