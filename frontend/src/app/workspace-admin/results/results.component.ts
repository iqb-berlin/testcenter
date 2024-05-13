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
import { ReportType, ResultData } from '../workspace.interfaces';

@Component({
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'selectCheckbox', 'groupName', 'bookletsStarted', 'numUnitsMin', 'numUnitsMax', 'numUnitsAvg', 'lastChange'
  ];

  resultDataSource: MatTableDataSource<ResultData> | null = new MatTableDataSource<ResultData>([]);
  tableSelectionCheckbox = new SelectionModel<ResultData>(true, []);

  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  private wsIdSubscription: Subscription | null = null;

  constructor(
    private backendService: BackendService,
    private deleteConfirmDialog: MatDialog,
    public workspaceDataService: WorkspaceDataService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.wsIdSubscription = this.workspaceDataService.workspaceId$
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
    this.resultDataSource = null;
    this.backendService.getResults(this.workspaceDataService.workspaceId)
      .subscribe((resultData: ResultData[]) => {
        this.resultDataSource = new MatTableDataSource<ResultData>(resultData);
        this.resultDataSource.sort = this.sort;
      });
  }

  isAllSelected(): boolean {
    const numSelected = this.tableSelectionCheckbox.selected.length;
    const numRows = this.resultDataSource?.data.length || 0;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.tableSelectionCheckbox.clear() :
      this.resultDataSource?.data.forEach(row => this.tableSelectionCheckbox.select(row));
  }

  downloadResponsesCSV(): void {
    this.downloadCSVReport(ReportType.RESPONSE, 'iqb-testcenter-responses.csv');
  }

  downloadReviewsCSV(): void {
    this.downloadCSVReport(ReportType.REVIEW, 'iqb-testcenter-reviews.csv');
  }

  downloadNewReviewsCSV(): void {
    this.downloadCSVReport(ReportType.REVIEW, 'iqb-testcenter-reviews.csv', true);
  }

  downloadLogsCSV(): void {
    this.downloadCSVReport(ReportType.LOG, 'iqb-testcenter-logs.csv');
  }

  downloadCSVReport(reportType: ReportType, filename: string, newFeature: boolean = false): void {
    if (this.tableSelectionCheckbox.selected.length > 0) {
      const dataIds: string[] = [];

      this.tableSelectionCheckbox.selected.forEach(element => {
        dataIds.push(element.groupName);
      });

      this.workspaceDataService.downloadReport(dataIds, reportType, filename, newFeature);

      this.tableSelectionCheckbox.clear();
    }
  }

  deleteData(): void {
    if (this.tableSelectionCheckbox.selected.length > 0) {
      const selectedGroups: string[] = [];
      this.tableSelectionCheckbox.selected.forEach(element => {
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

      dialogRef.afterClosed()
        .subscribe(result => {
          if (result === false) {
            return;
          }
          this.backendService.deleteResponses(this.workspaceDataService.workspaceId, selectedGroups)
            .subscribe(() => {
              this.snackBar.open('Löschen erfolgreich.', 'OK', { duration: 5000 });
              this.tableSelectionCheckbox.clear();
              this.updateTable();
            });
        });
    }
  }
}
