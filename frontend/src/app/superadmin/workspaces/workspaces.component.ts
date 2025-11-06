import { MatTableDataSource } from '@angular/material/table';
import { ViewChild, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import {
  ConfirmDialogComponent, ConfirmDialogData,
  MessageDialogComponent, MessageDialogData
} from '../../shared/shared.module';
import { BackendService } from '../backend.service';
import { NewworkspaceComponent } from './newworkspace/newworkspace.component';
import { EditworkspaceComponent } from './editworkspace/editworkspace.component';
import { IdAndName, IdRoleData } from '../superadmin.interfaces';

@Component({
    templateUrl: './workspaces.component.html',
    styleUrls: ['./workspaces.component.css'],
    standalone: false
})
export class WorkspacesComponent implements OnInit {
  workspaces: MatTableDataSource<IdAndName> = new MatTableDataSource<IdAndName>();
  displayedColumns = ['name', 'modification_timestamp'];
  tableSelectionRow = new SelectionModel<IdAndName>(false, []);
  selectedWorkspaceId = 0;
  selectedWorkspaceName = '';
  pendingUserChanges = false;
  userListDatasource: MatTableDataSource<IdRoleData> = new MatTableDataSource<IdRoleData>();
  displayedUserColumns = ['selectCheckbox', 'name'];

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private backendService: BackendService,
    private newWorkspaceDialog: MatDialog,
    private editworkspaceDialog: MatDialog,
    private deleteConfirmDialog: MatDialog,
    private messsageDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.tableSelectionRow.changed.subscribe(
      r => {
        if (r.added.length > 0) {
          this.selectedWorkspaceId = r.added[0].id;
          this.selectedWorkspaceName = r.added[0].name;
        } else {
          this.selectedWorkspaceId = 0;
          this.selectedWorkspaceName = '';
        }
        this.updateUserList();
      }
    );
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.updateWorkspaceList();
    });
  }

  addObject(): void {
    const dialogRef = this.newWorkspaceDialog.open(NewworkspaceComponent, {
      width: '600px',
      data: {
        name: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      const newName = result.get('name').value;
      if (this.workspaceNameExists(newName)) {
        this.snackBar.open('Arbeitsbereich mit diesem namen bereits vorhanden!', 'Fehler', { duration: 1000 });
        return;
      }

      this.backendService.addWorkspace(newName)
        .subscribe(() => {
          this.snackBar.open('Arbeitsbereich hinzugefügt', '', { duration: 1000 });
          this.updateWorkspaceList();
        });
    });
  }

  private workspaceNameExists(newName: string): boolean {
    return this.workspaces.data
      .map(ws => ws.name)
      .includes(newName);
  }

  changeObject(): void {
    const selectedRows = this.tableSelectionRow.selected;
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Arbeitsbereich ändern',
          content: 'Bitte markieren Sie erst einen Arbeitsbereich!',
          type: 'error'
        }
      });
    } else {
      const dialogRef = this.editworkspaceDialog.open(EditworkspaceComponent, {
        width: '600px',
        data: selectedRows[0].name
      });

      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          return;
        }

        const newName = result.get('name').value;
        if (this.workspaceNameExists(newName)) {
          this.snackBar.open('Arbeitsbereich mit diesem namen bereits vorhanden!', 'Fehler', { duration: 1000 });
          return;
        }

        this.backendService.renameWorkspace(selectedRows[0].id, newName)
          .subscribe(
            () => {
              this.snackBar.open('Arbeitsbereich geändert', '', { duration: 1000 });
              this.updateWorkspaceList();
            }
          );
      });
    }
  }

  deleteObject(): void {
    const selectedRows = this.tableSelectionRow.selected;
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Löschen von Arbeitsbereichen',
          content: 'Bitte markieren Sie erst Arbeitsbereich/e!',
          type: 'error'
        }
      });
    } else {
      let prompt;
      if (selectedRows.length > 1) {
        prompt = `Sollen ${selectedRows.length} Arbeitsbereiche gelöscht werden?`;
      } else {
        prompt = `Arbeitsbereich "${selectedRows[0].name}" gelöscht werden?`;
      }
      const dialogRef = this.deleteConfirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Arbeitsbereichen',
          content: prompt,
          confirmbuttonlabel: 'Arbeitsbereich/e löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          const workspacesToDelete: number[] = [];
          selectedRows.forEach((r: IdAndName) => workspacesToDelete.push(r.id));
          this.backendService.deleteWorkspaces(workspacesToDelete)
            .subscribe(() => {
              this.snackBar.open('Arbeitsbereich/e gelöscht', 'Fehler', { duration: 1000 });
              this.updateWorkspaceList();
            });
        }
      });
    }
  }

  updateUserList(): void {
    this.pendingUserChanges = false;
    if (this.selectedWorkspaceId > 0) {
      this.userListDatasource = new MatTableDataSource();
      this.backendService.getUsersByWorkspace(this.selectedWorkspaceId)
        .subscribe(dataresponse => {
          this.userListDatasource = new MatTableDataSource(dataresponse);
        });
    }
  }

  selectPermissions(user: IdRoleData, role: string): void {
    if (role === 'RW') {
      user.role = (user.role === 'RW') ? 'RO' : 'RW';
    } else if (role === 'RO') {
      user.role = (user.role === 'RO' || user.role === 'RW') ? '' : 'RO';
    }
    this.pendingUserChanges = true;
  }

  saveUsers():void {
    this.pendingUserChanges = false;
    if (this.selectedWorkspaceId > 0) {
      this.backendService.setUsersByWorkspace(this.selectedWorkspaceId, this.userListDatasource.data)
        .subscribe(() => {
          this.snackBar.open('Zugriffsrechte geändert', '', { duration: 1000 });
        });
    } else {
      this.userListDatasource = new MatTableDataSource<IdRoleData>();
    }
  }

  updateWorkspaceList(): void {
    this.backendService.getWorkspaces().subscribe(dataresponse => {
      this.workspaces = new MatTableDataSource(dataresponse);
      this.workspaces.sort = this.sort;
      this.tableSelectionRow.clear();
    });
  }

  selectRow(row: IdAndName): void {
    this.tableSelectionRow.select(row);
  }
}
