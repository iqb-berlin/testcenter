import {
  Component, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/shared.module';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { ReportType, SysCheckStatistics } from '../workspace.interfaces';

@Component({
    templateUrl: './syscheck.component.html',
    styleUrls: ['./syscheck.component.css'],
    standalone: false
})
export class SyscheckComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['selectCheckbox', 'syscheckLabel', 'number', 'details-os', 'details-browser'];
  resultDataSource: MatTableDataSource<SysCheckStatistics> = new MatTableDataSource<SysCheckStatistics>([]);
  tableSelectionCheckbox = new SelectionModel<SysCheckStatistics>(true, []);

  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  private wsIdSubscription: Subscription | null = null;

  constructor(
    private bs: BackendService,
    private deleteConfirmDialog: MatDialog,
    public wds: WorkspaceDataService,
    public snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.wsIdSubscription = this.wds.workspaceId$
        .subscribe(() => {
          this.updateTable();
        });
    });
  }

  ngOnDestroy(): void {
    if (this.wsIdSubscription) {
      this.wsIdSubscription.unsubscribe();
      this.wsIdSubscription = null;
    }
  }

  updateTable(): void {
    this.tableSelectionCheckbox.clear();
    this.resultDataSource = new MatTableDataSource<SysCheckStatistics>([]);
    this.bs.getSysCheckReportsOverview(this.wds.workspaceId)
      .subscribe((resultData: SysCheckStatistics[]) => {
        this.resultDataSource = new MatTableDataSource<SysCheckStatistics>(resultData);
        this.resultDataSource.sort = this.sort;
      });
  }

  isAllSelected(): boolean {
    const numSelected = this.tableSelectionCheckbox.selected.length;
    const numRows = this.resultDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.tableSelectionCheckbox.clear() :
      this.resultDataSource.data.forEach(row => this.tableSelectionCheckbox.select(row));
  }

  downloadReportsCSV(): void {
    if (this.tableSelectionCheckbox.selected.length > 0) {
      const dataIds: string[] = [];
      this.tableSelectionCheckbox.selected.forEach(element => {
        dataIds.push(element.id);
      });

      this.wds.downloadReport(dataIds, ReportType.SYSTEM_CHECK, 'iqb-testcenter-syscheckreports.csv');

      this.tableSelectionCheckbox.clear();
    }
  }

  deleteReports(): void {
    if (this.tableSelectionCheckbox.selected.length > 0) {
      const selectedReports: string[] = [];
      this.tableSelectionCheckbox.selected.forEach(element => {
        selectedReports.push(element.id);
      });

      let prompt = 'Es werden alle Berichte für diese';
      if (selectedReports.length > 1) {
        prompt = `${prompt} ${selectedReports.length} System-Checks `;
      } else {
        prompt = `${prompt}n System-Check "${selectedReports[0]}" `;
      }

      const dialogRef = this.deleteConfirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Berichten',
          content: `${prompt}gelöscht. Fortsetzen?`,
          confirmbuttonlabel: 'Berichtsdaten löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed()
        .subscribe(result => {
          if (result === true) {
            this.bs.deleteSysCheckReports(this.wds.workspaceId, selectedReports)
              .subscribe(fileDeletionReport => {
                const message = [];
                if (fileDeletionReport.deleted.length > 0) {
                  message.push(`${fileDeletionReport.deleted.length} Berichte erfolgreich gelöscht.`);
                }
                if (fileDeletionReport.not_allowed.length > 0) {
                  message.push(`${fileDeletionReport.not_allowed.length} Berichte konnten nicht gelöscht werden.`);
                }
                this.snackBar.open(message.join('<br>'), message.length > 1 ? 'Achtung' : '', { duration: 1000 });
                this.updateTable();
              });
          }
        });
    }
  }
}
