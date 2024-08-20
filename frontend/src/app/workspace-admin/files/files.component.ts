import {
  Component, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  MainDataService,
  MessageDialogComponent,
  MessageDialogData
} from '../../shared/shared.module';
import { WorkspaceDataService } from '../workspacedata.service';
import {
  GetFileResponseData, IQBFile, IQBFileType, IQBFileTypes
} from '../workspace.interfaces';
import { BackendService } from '../backend.service';
import { IqbFilesUploadQueueComponent } from './iqb-files-upload-queue/iqb-files-upload-queue.component';
import { FileDeletionReport } from './files.interfaces';
import { FileService } from '../../shared/services/file.service';

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
export class FilesComponent implements OnInit, OnDestroy {
  files: { [type in IQBFileType]: MatTableDataSource<IQBFile> };
  fileTypes = IQBFileTypes;
  displayedColumns = ['checked', 'name', 'size', 'modificationTime'];
  fileNameAlias = 'fileforvo';

  lastSort: Sort = {
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

  selectedRow: IQBFile | null = null;
  dependenciesOfRow: IQBFile[] = [];

  private wsIdSubscription: Subscription | null = null;

  @ViewChild('fileUploadQueue', { static: true }) uploadQueue!: IqbFilesUploadQueueComponent;

  constructor(
    private bs: BackendService,
    public wds: WorkspaceDataService,
    public confirmDialog: MatDialog,
    public messageDialog: MatDialog,
    private mds: MainDataService,
    public snackBar: MatSnackBar
  ) {
    this.files = IQBFileTypes.reduce((acc, str) => {
      acc[str] = new MatTableDataSource<IQBFile>();
      return acc;
    }, <{ [type in IQBFileType]: MatTableDataSource<IQBFile> }>{});
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.wsIdSubscription = this.wds.workspaceId$
        .subscribe(() => {
          this.updateFileList();
        });
    });
  }

  ngOnDestroy(): void {
    if (this.wsIdSubscription) {
      this.wsIdSubscription.unsubscribe();
      this.wsIdSubscription = null;
    }
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

    const filesToDelete: string[] = [];
    IQBFileTypes.forEach(type => {
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
          this.bs.deleteFiles(this.wds.workspaceId, filesToDelete)
            .subscribe((fileDeletionReport: FileDeletionReport) => {
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
      // TODO disable this button if nothing is selected instead of this
      this.messageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Löschen von Dateien',
          content: 'Bitte markieren Sie erst Dateien!',
          type: 'error'
        }
      });
    }
  }

  updateFileList(shouldEmpty = false): void {
    if (shouldEmpty) {
      IQBFileTypes
        .forEach(type => {
          this.files[type] = new MatTableDataSource();
        });
    } else {
      this.bs.getFiles(this.wds.workspaceId)
        .pipe(
          map(fileList => this.addFrontendChecksToFiles(fileList))
        )
        .subscribe(fileList => {
          IQBFileTypes
            .forEach(type => {
              this.files[type] = new MatTableDataSource(fileList[type]);
            });
          this.fileStats = FilesComponent.getStats(fileList);
          this.setTableSorting(this.lastSort);

          this.bs.getFilesWithDependencies(this.wds.workspaceId, ...IQBFileTypes.map(typehere => fileList[typehere].map(file => file.name)).flat())
            .subscribe(withDependencies => {
              const withDependenciesWithFileSize = FilesComponent.calculateFileSize(withDependencies);
              IQBFileTypes
                .forEach(type => {
                  this.files[type] = new MatTableDataSource(withDependenciesWithFileSize[type]);
                });
            });
        });
    }
  }

  private static getStats(fileList: GetFileResponseData): FileStats {
    const stats: FileStats = {
      total: {
        count: 0,
        invalid: 0
      },
      invalid: <{ [key in IQBFileType]: number }>{},
      testtakers: 0
    };
    IQBFileTypes
      .forEach(type => {
        fileList[type]?.forEach(file => {
          if (typeof stats.invalid[type] === 'undefined') {
            stats.invalid[type] = 0;
          }
          stats.total.count += 1;
          if (file.report.error && file.report.error.length) {
            stats.invalid[type]! += 1;
            stats.total.invalid += 1;
          }
          stats.testtakers += (typeof file.info.testtakers === 'number') ? file.info.testtakers : 0;
        });
      });
    return stats;
  }

  private addFrontendChecksToFiles(fileList: GetFileResponseData): GetFileResponseData {
    IQBFileTypes.forEach(type => {
      fileList[type] = fileList[type]?.map(files => this.addFrontendChecksToFile(files));
    });
    return fileList;
  }

  private addFrontendChecksToFile(file: IQBFile): IQBFile {
    if (file.info.veronaVersion) {
      const fileMayor = parseInt(file.info.veronaVersion.toString().split('.').shift() ?? '', 10);
      if (typeof file.report.error === 'undefined') {
        // eslint-disable-next-line no-param-reassign
        file.report.error = [];
      }
      if (
        this.mds.appConfig && (
          fileMayor < this.mds.appConfig?.veronaPlayerApiVersionMin ||
          fileMayor > this.mds.appConfig?.veronaPlayerApiVersionMax
        )
      ) {
        file.report.error.push(
          `Verona Version \`${fileMayor}\` is not supported
          (only versions between \`${this.mds.appConfig?.veronaPlayerApiVersionMin}\` 
          and \`${this.mds.appConfig?.veronaPlayerApiVersionMax}\`)`
        );
      }
    }
    return file;
  }

  download(file: IQBFile): void {
    this.bs.getFile(this.wds.workspaceId, file.type, file.name)
      .subscribe((fileData: Blob) => {
        FileService.saveBlobToFile(fileData as Blob, file.name);
      });
  }

  setTableSorting(sort: Sort): void {
    this.lastSort = sort;

    function compare(a: number | string | boolean, b: number | string | boolean, isAsc: boolean) {
      if ((typeof a === 'string') && (typeof b === 'string')) {
        return a.localeCompare(b) * (isAsc ? 1 : -1);
      }
      return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }

    IQBFileTypes
      .forEach(type => {
        this.files[type].data = this.files[type].data
          .sort((a, b) => {
            type IQBFileProperty = 'name' | 'size' | 'modificationTime' | 'type' | 'isChecked';
            return compare(a[sort.active as IQBFileProperty], b[sort.active as IQBFileProperty], (sort.direction === 'asc'));
          });
      });
  }

  selectRow(event: Event, row: IQBFile) {
    if (event.target instanceof HTMLElement && event.target.tagName === 'MAT-CELL') {
      this.dependenciesOfRow = [];
      this.selectedRow = this.selectedRow === row ? null : row;

      if (this.selectedRow) {
        const dependencies = this.getDependenciesOfFile(row);
        this.dependenciesOfRow = [...dependencies];
      } else {
        this.dependenciesOfRow = [];
      }
    }
  }

  getDependenciesOfFile(inputFile: IQBFile): IQBFile[] {
    const depTree: { [Type in IQBFileType]: IQBFileType[]; } = {
      Resource: ['Unit', 'Booklet', 'SysCheck', 'Testtakers'],
      Unit: ['Booklet', 'SysCheck', 'Testtakers'],
      Booklet: ['Testtakers'],
      SysCheck: [],
      Testtakers: []
    };
    const result: IQBFile[] = [];

    depTree[inputFile.type].forEach(type => {
      this.files[type].data.forEach(file => {
        file.dependencies.forEach(dep => {
          if (dep.object_name === inputFile.name) {
            result.push(file);
          }
        });
      });
    });
    return result;
  }

  private static calculateFileSize(fileList: GetFileResponseData) {
    const needsToCalculate = IQBFileTypes.filter(type => type !== 'Testtakers' && type !== 'SysCheck' && type !== 'Resource');

    IQBFileTypes.forEach(type => {
      fileList[type]?.forEach(file => {
        if (needsToCalculate.includes(type) && file.dependencies.length !== 0) {
          file.info.totalSize = file.size;
          file.dependencies.forEach(dep => {
            if (
              dep.relationship_type !== 'usesPlayer' ||
              (dep.relationship_type === 'usesPlayer' && file.type === 'Booklet')
            ) {
              const innerFilteredTypes = IQBFileTypes.filter(innertype => innertype !== 'Testtakers' && innertype !== 'SysCheck' && innertype !== 'Booklet');
              innerFilteredTypes.forEach(innertype => {
                fileList[innertype].forEach(checkedDependency => {
                  if (checkedDependency.name === dep.object_name) {
                    file.info.totalSize! += checkedDependency.size;
                  }
                });
              });
            }
          });
        } else {
          file.info.totalSize = file.size;
        }
      });
    });

    return fileList;
  }
}
