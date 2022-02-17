import { Component, OnInit, ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmDialogComponent, ConfirmDialogData, MainDataService } from '../../shared/shared.module';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { ReportType, SysCheckStatistics } from '../workspace.interfaces';

@Component({
  templateUrl: './syscheck.component.html',
  styleUrls: ['./syscheck.component.css']
})
export class SyscheckComponent implements OnInit {
  displayedColumns: string[] = ['selectCheckbox', 'syscheckLabel', 'number', 'details-os', 'details-browser'];
  resultDataSource = new MatTableDataSource<SysCheckStatistics>([]);
  // prepared for selection if needed sometime
  tableselectionCheckbox = new SelectionModel<SysCheckStatistics>(true, []);

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private mds: MainDataService,
    private bs: BackendService,
    private deleteConfirmDialog: MatDialog,
    public wds: WorkspaceDataService,
    public snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.updateTable();
    });
  }

  updateTable(): void {
    this.tableselectionCheckbox.clear();
    this.bs.getSysCheckReportList(this.wds.wsId).subscribe(
      (resultData: SysCheckStatistics[]) => {
        this.resultDataSource = new MatTableDataSource<SysCheckStatistics>(resultData);
        this.resultDataSource.sort = this.sort;
        this.mds.setSpinnerOff();
      }
    );
  }

  isAllSelected(): boolean {
    const numSelected = this.tableselectionCheckbox.selected.length;
    const numRows = this.resultDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.tableselectionCheckbox.clear() :
      this.resultDataSource.data.forEach(row => this.tableselectionCheckbox.select(row));
  }

  downloadReportsCSV(): void {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const dataIds: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        dataIds.push(element.id);
      });

      this.wds.downloadReport(dataIds, ReportType.SYSTEM_CHECK, 'iqb-testcenter-syscheckreports.csv');

      this.tableselectionCheckbox.clear();
    }
  }

  deleteReports(): void {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const selectedReports: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
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

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          this.mds.setSpinnerOn();
          this.bs.deleteSysCheckReports(this.wds.wsId, selectedReports).subscribe(fileDeletionReport => {
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
