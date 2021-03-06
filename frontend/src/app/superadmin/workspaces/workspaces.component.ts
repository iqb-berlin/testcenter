import { MatTableDataSource } from '@angular/material/table';
import { ViewChild, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import {
  ConfirmDialogComponent, ConfirmDialogData,
  MessageDialogComponent, MessageDialogData, MessageType, MainDataService
} from '../../shared/shared.module';
import { BackendService } from '../backend.service';
import { NewworkspaceComponent } from './newworkspace/newworkspace.component';
import { EditworkspaceComponent } from './editworkspace/editworkspace.component';
import { IdAndName, IdRoleData } from '../superadmin.interfaces';

@Component({
  templateUrl: './workspaces.component.html',
  styleUrls: ['./workspaces.component.css']
})
export class WorkspacesComponent implements OnInit {
  objectsDatasource: MatTableDataSource<IdAndName>;
  displayedColumns = ['selectCheckbox', 'name'];
  tableselectionCheckbox = new SelectionModel <IdAndName>(true, []);
  tableselectionRow = new SelectionModel <IdAndName>(false, []);
  selectedWorkspaceId = 0;
  selectedWorkspaceName = '';
  pendingUserChanges = false;
  UserlistDatasource: MatTableDataSource<IdRoleData>;
  displayedUserColumns = ['selectCheckbox', 'name'];

  @ViewChild(MatSort) sort: MatSort;

  constructor(private backendService: BackendService,
              private mainDataService: MainDataService,
              private newworkspaceDialog: MatDialog,
              private editworkspaceDialog: MatDialog,
              private deleteConfirmDialog: MatDialog,
              private messsageDialog: MatDialog,
              private snackBar: MatSnackBar) {
    this.tableselectionRow.changed.subscribe(
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
      this.mainDataService.showLoadingAnimation();
      this.updateObjectList();
    });
  }

  addObject(): void {
    const dialogRef = this.newworkspaceDialog.open(NewworkspaceComponent, {
      width: '600px',
      data: {
        name: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (typeof result !== 'undefined' && result !== false) {
        this.mainDataService.showLoadingAnimation();
        this.backendService.addWorkspace((<FormGroup>result).get('name').value).subscribe(
          respOk => {
            if (respOk !== false) {
              this.snackBar.open('Arbeitsbereich hinzugef??gt', '', { duration: 1000 });
              this.updateObjectList();
            } else {
              this.mainDataService.stopLoadingAnimation();
              this.snackBar.open('Konnte Arbeitsbereich nicht hinzuf??gen', 'Fehler', { duration: 1000 });
            }
          }
        );
      }
    });
  }

  changeObject(): void {
    let selectedRows = this.tableselectionRow.selected;
    if (selectedRows.length === 0) {
      selectedRows = this.tableselectionCheckbox.selected;
    }
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Arbeitsbereich ??ndern',
          content: 'Bitte markieren Sie erst einen Arbeitsbereich!',
          type: MessageType.error
        }
      });
    } else {
      const dialogRef = this.editworkspaceDialog.open(EditworkspaceComponent, {
        width: '600px',
        data: selectedRows[0].name
      });

      dialogRef.afterClosed().subscribe(result => {
        if (typeof result !== 'undefined') {
          if (result !== false) {
            this.mainDataService.showLoadingAnimation();
            this.backendService.renameWorkspace(
              selectedRows[0].id,
              (<FormGroup>result).get('name').value
            )
              .subscribe(
                respOk => {
                  if (respOk !== false) {
                    this.snackBar.open('Arbeitsbereich ge??ndert', '', { duration: 1000 });
                    this.updateObjectList();
                  } else {
                    this.mainDataService.stopLoadingAnimation();
                    this.snackBar.open('Konnte Arbeitsbereich nicht ??ndern', 'Fehler', { duration: 2000 });
                  }
                }
              );
          }
        }
      });
    }
  }

  deleteObject(): void {
    let selectedRows = this.tableselectionCheckbox.selected;
    if (selectedRows.length === 0) {
      selectedRows = this.tableselectionRow.selected;
    }
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'L??schen von Arbeitsbereichen',
          content: 'Bitte markieren Sie erst Arbeitsbereich/e!',
          type: MessageType.error
        }
      });
    } else {
      let prompt;
      if (selectedRows.length > 1) {
        prompt = `Sollen ${selectedRows.length} Arbeitsbereiche gel??scht werden?`;
      } else {
        prompt = `Arbeitsbereich "${selectedRows[0].name}" gel??scht werden?`;
      }
      const dialogRef = this.deleteConfirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'L??schen von Arbeitsbereichen',
          content: prompt,
          confirmbuttonlabel: 'Arbeitsbereich/e l??schen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          const workspacesToDelete = [];
          selectedRows.forEach((r: IdAndName) => workspacesToDelete.push(r.id));
          this.mainDataService.showLoadingAnimation();
          this.backendService.deleteWorkspaces(workspacesToDelete).subscribe(
            respOk => {
              if (respOk !== false) {
                this.snackBar.open('Arbeitsbereich/e gel??scht', '', { duration: 1000 });
                this.updateObjectList();
              } else {
                this.mainDataService.stopLoadingAnimation();
                this.snackBar.open('Konnte Arbeitsbereich/e nicht l??schen', 'Fehler', { duration: 1000 });
              }
            }
          );
        }
      });
    }
  }

  updateUserList(): void {
    this.pendingUserChanges = false;
    if (this.selectedWorkspaceId > 0) {
      this.mainDataService.showLoadingAnimation();
      this.backendService.getUsersByWorkspace(this.selectedWorkspaceId).subscribe(dataresponse => {
        this.UserlistDatasource = new MatTableDataSource(dataresponse);
        this.mainDataService.stopLoadingAnimation();
      });
    } else {
      this.UserlistDatasource = null;
    }
  }

  selectUser(ws: IdRoleData, role: string): void {
    if (ws.role === role) {
      ws.role = '';
    } else {
      ws.role = role;
    }
    this.pendingUserChanges = true;
  }

  saveUsers():void {
    this.pendingUserChanges = false;
    if (this.selectedWorkspaceId > 0) {
      this.mainDataService.showLoadingAnimation();
      this.backendService.setUsersByWorkspace(this.selectedWorkspaceId, this.UserlistDatasource.data).subscribe(
        respOk => {
          this.mainDataService.stopLoadingAnimation();
          if (respOk !== false) {
            this.snackBar.open('Zugriffsrechte ge??ndert', '', { duration: 1000 });
          } else {
            this.snackBar.open('Konnte Zugriffsrechte nicht ??ndern', 'Fehler', { duration: 2000 });
          }
        }
      );
    } else {
      this.UserlistDatasource = null;
    }
  }

  updateObjectList(): void {
    this.backendService.getWorkspaces().subscribe(dataresponse => {
      this.objectsDatasource = new MatTableDataSource(dataresponse);
      this.objectsDatasource.sort = this.sort;
      this.tableselectionCheckbox.clear();
      this.tableselectionRow.clear();
      this.mainDataService.stopLoadingAnimation();
    });
  }

  isAllSelected(): boolean {
    const numSelected = this.tableselectionCheckbox.selected.length;
    const numRows = this.objectsDatasource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.tableselectionCheckbox.clear();
    } else {
      this.objectsDatasource.data.forEach(row => this.tableselectionCheckbox.select(row));
    }
  }

  selectRow(row: IdAndName): void {
    this.tableselectionRow.select(row);
  }
}
