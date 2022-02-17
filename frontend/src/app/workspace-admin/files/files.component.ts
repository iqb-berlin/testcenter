import {
  Component, OnInit, Inject, ViewChild
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';

import { saveAs } from 'file-saver';
import { map } from 'rxjs/operators';
import {
  ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType, MainDataService
} from '../../shared/shared.module';
import { WorkspaceDataService } from '../workspacedata.service';
import {
  IQBFileType, GetFileResponseData, IQBFile, IQBFileTypes
} from '../workspace.interfaces';
import { BackendService } from '../backend.service';
import { IqbFilesUploadQueueComponent } from './iqb-files-upload-queue/iqb-files-upload-queue.component';
import { FileDeletionReport } from './files.interfaces';

interface FileStats {
  invalid: {
    [type in IQBFileType]?: number;
  }
  total: {
    count: number;
    invalid: number;
  };
  testtakers: number;
}

@Component({
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css']
})
export class FilesComponent implements OnInit {
  files: { [type in IQBFileType]?: MatTableDataSource<IQBFile> } = {};
  fileTypes = IQBFileTypes;
  displayedColumns = ['checked', 'name', 'size', 'modificationTime'];
  fileNameAlias = 'fileforvo';

  lastSort:Sort = {
    active: 'name',
    direction: 'asc'
  };

  typeLabels = {
    Testtakers: 'Teilnehmerlisten',
    Booklet: 'Testhefte',
    SysCheck: 'System-Check-Definitionen',
    Resource: 'Ressourcen',
    Unit: 'Units'
  };

  fileStats: FileStats = {
    total: {
      count: 0,
      invalid: 0
    },
    invalid: {},
    testtakers: 0
  };

  @ViewChild('fileUploadQueue', { static: true }) uploadQueue: IqbFilesUploadQueueComponent;

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    @Inject('VERONA_PLAYER_API_VERSION_MIN') public veronaPlayerApiVersionMin: number,
    @Inject('VERONA_PLAYER_API_VERSION_MAX') public veronaPlayerApiVersionMax: number,
    private bs: BackendService,
    public wds: WorkspaceDataService,
    public confirmDialog: MatDialog,
    public messageDialog: MatDialog,
    private mds: MainDataService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // this.uploadUrl = `${this.serverUrl}workspace/${this.wds.wsId}/file`;
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.updateFileList();
    });
  }

  checkAll(isChecked: boolean, type: IQBFileType): void {
    this.files[type].data = this.files[type].data.map(file => {
      file.isChecked = isChecked;
      return file;
    });
  }

  deleteFiles(): void {
    if (this.wds.wsRole !== 'RW') {
      return;
    }

    const filesToDelete = [];
    Object.keys(this.files).forEach(type => {
      this.files[type].data.forEach(file => {
        if (file.isChecked) {
          filesToDelete.push(`${file.type}/${file.name}`);
        }
      });
    });

    if (filesToDelete.length > 0) {
      const p = filesToDelete.length > 1;
      const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Dateien',
          content: `Sie haben ${p ? filesToDelete.length : 'eine'} Datei${p ? 'en' : ''}\`
            ausgewählt. Soll${p ? 'en' : ''}  diese gelöscht werden?`,
          confirmbuttonlabel: 'Löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          this.mds.setSpinnerOn();
          this.bs.deleteFiles(this.wds.wsId, filesToDelete).subscribe((fileDeletionReport: FileDeletionReport) => {
            const message = [];
            if (fileDeletionReport.deleted.length > 0) {
              message.push(`${fileDeletionReport.deleted.length} Dateien erfolgreich gelöscht.`);
            }
            if (fileDeletionReport.not_allowed.length > 0) {
              message.push(`${fileDeletionReport.not_allowed.length} Dateien konnten nicht gelöscht werden.`);
            }
            if (fileDeletionReport.was_used.length > 0) {
              message.push(`${fileDeletionReport.was_used.length} Dateien werden von anderen verwendet
              und wurden nicht gelöscht.`);
            }
            this.snackBar.open(message.join('<br>'), message.length > 1 ? 'Achtung' : '', { duration: 1000 });
            this.updateFileList();
          });
        }
      });
    } else {
      this.messageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Löschen von Dateien',
          content: 'Bitte markieren Sie erst Dateien!',
          type: MessageType.error
        }
      });
    }
  }

  updateFileList(empty = false): void {
    if (empty) {
      this.files = {};
      this.mds.setSpinnerOff();
    } else {
      this.bs.getFiles(this.wds.wsId)
        .pipe(map(fileList => this.addFrontendChecksToFiles(fileList)))
        .subscribe(fileList => {
          this.files = {};
          Object.keys(fileList)
            .forEach(type => {
              this.files[type] = new MatTableDataSource(fileList[type]);
            });
          this.fileStats = FilesComponent.getStats(fileList);
          this.setTableSorting(this.lastSort);
          this.mds.setSpinnerOff();
        });
    }
  }

  private static getStats(fileList: GetFileResponseData): FileStats {
    const stats: FileStats = {
      total: {
        count: 0,
        invalid: 0
      },
      invalid: {},
      testtakers: 0
    };
    Object.keys(fileList)
      .forEach(type => {
        fileList[type].forEach(file => {
          if (typeof stats.invalid[type] === 'undefined') {
            stats.invalid[type] = 0;
          }
          stats.total.count += 1;
          if (file.report.error && file.report.error.length) {
            stats.invalid[type] += 1;
            stats.total.invalid += 1;
          }
          stats.testtakers += (typeof file.info.testtakers === 'number') ? file.info.testtakers : 0;
        });
      });
    return stats;
  }

  private addFrontendChecksToFiles(fileList: GetFileResponseData): GetFileResponseData {
    Object.keys(fileList).forEach(type => {
      // eslint-disable-next-line no-param-reassign
      fileList[type] = fileList[type].map(files => this.addFrontendChecksToFile(files));
    });
    return fileList;
  }

  private addFrontendChecksToFile(file: IQBFile): IQBFile {
    if (file.info.veronaVersion) {
      const fileMayor = parseInt(file.info.veronaVersion.toString().split('.').shift(), 10);
      if (typeof file.report.error === 'undefined') {
        // eslint-disable-next-line no-param-reassign
        file.report.error = [];
      }
      if (fileMayor < this.veronaPlayerApiVersionMin || fileMayor > this.veronaPlayerApiVersionMax) {
        file.report.error.push(`Verona Version \`${fileMayor}\` is not supported
          (only versions between \`${this.veronaPlayerApiVersionMin}\` and \`${this.veronaPlayerApiVersionMax}\`)`);
      }
    }
    return file;
  }

  download(file: IQBFile): void {
    this.mds.setSpinnerOn();
    this.bs.downloadFile(this.wds.wsId, file.type, file.name)
      .subscribe(
        (fileData: Blob | boolean) => {
          this.mds.setSpinnerOff();
          if (fileData !== false) {
            saveAs(fileData as Blob, file.name);
          }
        }
      );
  }

  setTableSorting(sort: Sort): void {
    this.lastSort = sort;
    function compare(a: number | string, b: number | string, isAsc: boolean) {
      if ((typeof a === 'string') && (typeof b === 'string')) {
        return a.localeCompare(b) * (isAsc ? 1 : -1);
      }
      return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }
    Object.keys(this.files).forEach(type => {
      this.files[type].data = this.files[type].data
        .sort((a, b) => compare(a[sort.active], b[sort.active], (sort.direction === 'asc')));
    });
  }
}
