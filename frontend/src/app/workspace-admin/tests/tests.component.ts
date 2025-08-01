import {
  Component, OnInit, OnDestroy, ViewChild, AfterViewInit
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  MainDataService
} from '../../shared/shared.module';
import { WorkspaceDataService } from '../workspacedata.service';
import { BackendService } from '../backend.service';
import { TestSession, TestSessionRequest, TestSessionsResponse } from '../workspace.interfaces';

@Component({
  selector: 'tc-tests',
  templateUrl: './tests.component.html',
  styleUrls: ['./tests.component.css']
})
export class TestsComponent implements OnInit, OnDestroy {
  testSessions: TestSessionsResponse | null = null;
  groupNames: string[] = [];
  groupDataSources: { [groupName: string]: MatTableDataSource<TestSession> } = {};
  private workspaceSubscription: Subscription | null = null;

  lastSort: Sort = {
    active: 'name',
    direction: 'asc'
  };

  constructor(
    public mainDataService: MainDataService,
    public workspaceDataService: WorkspaceDataService,
    private backendService: BackendService,
    private snackBar: MatSnackBar,
    private confirmDialog: MatDialog
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.workspaceSubscription = this.workspaceDataService.workspaceId$.subscribe(workspaceId => {
        if (workspaceId) {
          this.loadTestSessions(workspaceId);
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.workspaceSubscription) {
      this.workspaceSubscription.unsubscribe();
    }
  }

  private loadTestSessions(workspaceId: number): void {
    this.backendService.getTestSessions(workspaceId).subscribe((data: TestSessionsResponse) => {
      this.testSessions = data;
      this.groupNames = Object.keys(data);
      this.groupDataSources = {};

      Object.keys(data).forEach(groupName => {
        data[groupName].forEach(session => {
          session.isChecked = false;
        });
        this.groupDataSources[groupName] = new MatTableDataSource(data[groupName]);
      });
      this.setTableSorting(this.lastSort);
    });
  }

  setTableSorting(sort: Sort): void {
    this.lastSort = sort;

    function compare(a: number | string | boolean | undefined, b: number | string | boolean | undefined, isAsc: boolean) {
      // Handle undefined values - treat as empty string for sorting
      const aVal = a ?? '';
      const bVal = b ?? '';

      if ((typeof aVal === 'string') && (typeof bVal === 'string')) {
        return aVal.localeCompare(bVal) * (isAsc ? 1 : -1);
      }
      return (aVal < bVal ? -1 : 1) * (isAsc ? 1 : -1);
    }

    Object.keys(this.groupDataSources).forEach(groupName => {
      this.groupDataSources[groupName].data = this.groupDataSources[groupName].data
        .sort((a, b) => {
          // Map column names to actual property names
          let propertyName: keyof TestSession;
          switch (sort.active) {
            case 'login':
              propertyName = 'loginName';
              break;
            case 'code':
              propertyName = 'code';
              break;
            case 'booklet':
              propertyName = 'bookletName';
              break;
            default:
              propertyName = sort.active as keyof TestSession;
          }
          return compare(a[propertyName], b[propertyName], (sort.direction === 'asc'));
        });
    });
  }

  checkAllInGroup(checked: boolean, groupName: string): void {
    if (this.testSessions && this.testSessions[groupName]) {
      this.testSessions[groupName].forEach(session => {
        session.isChecked = checked;
      });
      // Update data source to trigger change detection
      if (this.groupDataSources[groupName]) {
        this.groupDataSources[groupName].data = [...this.testSessions[groupName]];
      }
    }
  }

  isGroupFullySelected(groupName: string): boolean {
    if (!this.testSessions || !this.testSessions[groupName]) {
      return false;
    }
    return this.testSessions[groupName].every(session => session.isChecked);
  }

  isGroupPartiallySelected(groupName: string): boolean {
    if (!this.testSessions || !this.testSessions[groupName]) {
      return false;
    }
    const checkedSessions = this.testSessions[groupName].filter(session => session.isChecked);
    return checkedSessions.length > 0 && checkedSessions.length < this.testSessions[groupName].length;
  }

  onSessionCheckChange(session: TestSession, checked: boolean, groupName: string): void {
    session.isChecked = checked;
    // Update data source to trigger change detection
    if (this.groupDataSources[groupName]) {
      this.groupDataSources[groupName].data = [...this.testSessions![groupName]];
    }
  }

  getDataSourceForGroup(groupName: string): MatTableDataSource<TestSession> {
    return this.groupDataSources[groupName] || new MatTableDataSource<TestSession>([]);
  }

  getSelectedSessions(): TestSessionRequest[] {
    const selected: TestSessionRequest[] = [];
    if (this.testSessions) {
      Object.values(this.testSessions).forEach(sessions => {
        sessions.forEach(session => {
          if (session.isChecked) {
            selected.push({
              loginName: session.loginName,
              code: session.code,
              nameSuffix: session.nameSuffix,
              bookletName: session.bookletName
            });
          }
        });
      });
    }
    return selected;
  }

  hasSelectedSessions(): boolean {
    return this.getSelectedSessions().length > 0;
  }

  deleteSelectedSessions(): void {
    const selectedSessions = this.getSelectedSessions();
    if (selectedSessions.length === 0) {
      return;
    }

    const workspaceId = this.workspaceDataService.workspaceId$.value;
    if (!workspaceId) {
      return;
    }

    const p = selectedSessions.length > 1;
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: <ConfirmDialogData>{
        title: 'Löschen von Test-Sessions',
        content: `Sie haben ${p ? selectedSessions.length : 'eine'} Test-Session${p ? 's' : ''} ` +
          `ausgewählt. Soll${p ? 'en' : ''} diese gelöscht werden?`,
        confirmbuttonlabel: 'Löschen',
        showcancel: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.backendService.deleteTestSessionResponses(workspaceId, selectedSessions).subscribe({
          next: () => {
            this.snackBar.open(
              `${selectedSessions.length} Test-Session(s) erfolgreich gelöscht`,
              'Schließen',
              { duration: 3000 }
            );
            this.loadTestSessions(workspaceId);
          },
          error: error => {
            console.error('Error deleting test sessions:', error);
            this.snackBar.open('Fehler beim Löschen der Test-Sessions', 'Schließen', { duration: 3000 });
          }
        });
      }
    });
  }
}
