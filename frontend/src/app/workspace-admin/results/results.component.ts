import { Component, OnInit, ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmDialogComponent, ConfirmDialogData, MainDataService } from '../../shared/shared.module';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { ReportType, ResultData } from '../workspace.interfaces';

@Component({
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  displayedColumns: string[] = [
    'selectCheckbox', 'groupName', 'bookletsStarted', 'numUnitsMin', 'numUnitsMax', 'numUnitsAvg', 'lastChange'
  ];

  resultDataSource = new MatTableDataSource<ResultData>([]);
  // prepared for selection if needed sometime
  tableselectionCheckbox = new SelectionModel<ResultData>(true, []);

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private bs: BackendService,
    private deleteConfirmDialog: MatDialog,
    private mds: MainDataService,
    public wds: WorkspaceDataService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.updateTable();
    });
  }

  updateTable(): void {
    this.tableselectionCheckbox.clear();
    this.bs.getResultData(this.wds.wsId).subscribe(
      (resultData: ResultData[]) => {
        this.resultDataSource = new MatTableDataSource<ResultData>(resultData);
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

  downloadResponsesCSV(): void {
    this.downloadCSVReport(ReportType.RESPONSE, 'iqb-testcenter-responses.csv');
  }

  downloadReviewsCSV(): void {
    this.downloadCSVReport(ReportType.REVIEW, 'iqb-testcenter-reviews.csv');
  }

  downloadLogsCSV(): void {
    this.downloadCSVReport(ReportType.LOG, 'iqb-testcenter-logs.csv');
  }

  downloadCSVReport(reportType: ReportType, filename: string): void {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const dataIds: string[] = [];

      this.tableselectionCheckbox.selected.forEach(element => {
        dataIds.push(element.groupName);
      });

      this.wds.downloadReport(dataIds, reportType, filename);

      this.tableselectionCheckbox.clear();
    }
  }

  deleteData(): void {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupName);
      });

      let prompt = 'Es werden alle Antwort- und Logdaten in der Datenbank für diese ';
      if (selectedGroups.length > 1) {
        prompt += `${selectedGroups.length} Gruppen `;
      } else {
        prompt += `Gruppe "${selectedGroups[0]}" `;
      }

      const dialogRef = this.deleteConfirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Gruppendaten',
          content: `${prompt}gelöscht. Fortsetzen?`,
          confirmbuttonlabel: 'Gruppendaten löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          this.mds.setSpinnerOn();
          this.bs.deleteData(this.wds.wsId, selectedGroups).subscribe((ok: boolean) => {
            if (ok) {
              this.snackBar.open('Löschen erfolgreich.', 'Ok.', { duration: 3000 });
            } else {
              this.snackBar.open('Löschen nicht erfolgreich.', 'Fehler', { duration: 3000 });
            }
            this.tableselectionCheckbox.clear();
            this.updateTable();
          });
        }
      });
    }
  }
}
