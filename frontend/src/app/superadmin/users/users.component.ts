import { MatTableDataSource } from '@angular/material/table';
import { ViewChild, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType, MainDataService
} from '../../shared/shared.module';
import { IdRoleData, UserData } from '../superadmin.interfaces';
import {
  SuperadminPasswordRequestComponent
} from '../superadmin-password-request/superadmin-password-request.component';
import { ApiError } from '../../app.interfaces';
import { BackendService } from '../backend.service';
import { NewuserComponent } from './newuser/newuser.component';
import { NewpasswordComponent } from './newpassword/newpassword.component';

@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  objectsDatasource: MatTableDataSource<UserData>;
  displayedColumns = ['selectCheckbox', 'name'];
  tableselectionCheckbox = new SelectionModel<UserData>(true, []);
  tableselectionRow = new SelectionModel<UserData>(false, []);
  selectedUser = -1;
  selectedUserName = '';

  pendingWorkspaceChanges = false;
  WorkspacelistDatasource: MatTableDataSource<IdRoleData>;
  displayedWorkspaceColumns = ['selectCheckbox', 'label'];

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private bs: BackendService,
    private mds: MainDataService,
    private newuserDialog: MatDialog,
    private newpasswordDialog: MatDialog,
    private confirmDialog: MatDialog,
    private superadminPasswordDialog: MatDialog,
    private messsageDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.tableselectionRow.changed.subscribe(
      r => {
        if (r.added.length > 0) {
          this.selectedUser = r.added[0].id;
          this.selectedUserName = r.added[0].name;
        } else {
          this.selectedUser = -1;
          this.selectedUserName = '';
        }
        this.updateWorkspaceList();
      }
    );
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.updateObjectList();
    });
  }

  addObject(): void {
    const dialogRef = this.newuserDialog.open(NewuserComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (typeof result !== 'undefined') {
        if (result !== false) {
          this.mds.setSpinnerOn();
          this.bs.addUser(
            (<FormGroup>result).get('name').value,
            (<FormGroup>result).get('pw').value
          )
            .pipe(catchError((err: ApiError) => {
              this.snackBar.open(
                `Konnte Nutzer nicht hinzufügen: ${err.code} ${err.info} `,
                'Fehler',
                { duration: 5000 }
              );
              return of(false);
            })).subscribe(
              respOk => {
                if (respOk !== false) {
                  this.snackBar.open('Nutzer hinzugefügt', '', { duration: 1000 });
                  this.updateObjectList();
                } else {
                  this.mds.setSpinnerOff();
                }
              }
            );
        }
      }
    });
  }

  changeSuperadminStatus(): void {
    let selectedRows = this.tableselectionRow.selected;
    if (selectedRows.length === 0) {
      selectedRows = this.tableselectionCheckbox.selected;
    }
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Superadmin-Status ändern',
          content: 'Bitte markieren Sie erst einen Nutzer!',
          type: MessageType.error
        }
      });
    } else {
      const userObject = <UserData>selectedRows[0];
      const confirmDialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Ändern des Superadmin-Status',
          content:
            `Für "${userObject.name}" den Status auf "${userObject.isSuperadmin ? 'NICHT ' : ''}Superadmin" setzen?`,
          confirmbuttonlabel: 'Status ändern',
          showcancel: true
        }
      });

      confirmDialogRef.afterClosed().subscribe(result => {
        if ((typeof result !== 'undefined') && (result !== false)) {
          const passwdDialogRef = this.superadminPasswordDialog.open(SuperadminPasswordRequestComponent, {
            width: '600px',
            data: `Superadmin-Status ${userObject.isSuperadmin ? 'entziehen' : 'setzen'}`
          });

          passwdDialogRef.afterClosed().subscribe(afterClosedResult => {
            if (typeof afterClosedResult !== 'undefined') {
              if (afterClosedResult !== false) {
                this.mds.setSpinnerOn();
                this.bs.setSuperUserStatus(
                  selectedRows[0].id,
                  !userObject.isSuperadmin,
                  (<FormGroup>afterClosedResult).get('pw').value
                )
                  .subscribe(
                    respCode => {
                      if (respCode === 0) {
                        this.snackBar.open('Status geändert', '', { duration: 1000 });
                        this.updateObjectList();
                      } else if (respCode === 403) {
                        this.mds.setSpinnerOff();
                        this.snackBar.open(
                          'Konnte Status nicht ändern (falsches Kennwort?)',
                          'Fehler',
                          { duration: 5000 }
                        );
                      } else {
                        this.mds.setSpinnerOff();
                        this.snackBar.open(
                          `Konnte Status nicht ändern (Fehlercode ${respCode})`,
                          'Fehler',
                          { duration: 5000 }
                        );
                      }
                    }
                  );
              }
            }
          });
        }
      });
    }
  }

  changePassword(): void {
    let selectedRows = this.tableselectionRow.selected;
    if (selectedRows.length === 0) {
      selectedRows = this.tableselectionCheckbox.selected;
    }
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Kennwort ändern',
          content: 'Bitte markieren Sie erst einen Nutzer!',
          type: MessageType.error
        }
      });
    } else {
      const dialogRef = this.newpasswordDialog.open(NewpasswordComponent, {
        width: '600px',
        data: selectedRows[0].name
      });

      dialogRef.afterClosed().subscribe(result => {
        if (typeof result !== 'undefined') {
          if (result !== false) {
            this.mds.setSpinnerOn();
            this.bs.changePassword(
              selectedRows[0].id,
              (<FormGroup>result).get('pw').value
            )
              .pipe(catchError((err: ApiError) => {
                this.snackBar.open(
                  `Konnte Kennwort nicht ändern: ${err.code} ${err.info} `,
                  'Fehler',
                  { duration: 5000 }
                );
                return of(false);
              })).subscribe(
                respOk => {
                  this.mds.setSpinnerOff();
                  if (respOk !== false) {
                    this.snackBar.open('Kennwort geändert', '', { duration: 1000 });
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
          title: 'Löschen von Nutzern',
          content: 'Bitte markieren Sie erst Nutzer!',
          type: MessageType.error
        }
      });
    } else {
      let prompt;
      if (selectedRows.length > 1) {
        prompt = `Sollen ${selectedRows.length} Nutzer gelöscht werden?`;
      } else {
        prompt = `Soll Nutzer "${selectedRows[0].name}" gelöscht werden?`;
      }
      const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Nutzern',
          content: prompt,
          confirmbuttonlabel: 'Nutzer löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          const usersToDelete = [];
          selectedRows.forEach((r: UserData) => usersToDelete.push(r.id));
          this.mds.setSpinnerOn();
          this.bs.deleteUsers(usersToDelete).subscribe(
            respOk => {
              if (respOk !== false) {
                this.snackBar.open('Nutzer gelöscht', '', { duration: 1000 });
                this.updateObjectList();
              } else {
                this.mds.setSpinnerOff();
                this.snackBar.open('Konnte Nutzer nicht löschen', 'Fehler', { duration: 2000 });
              }
            }
          );
        }
      });
    }
  }

  updateWorkspaceList(): void {
    this.pendingWorkspaceChanges = false;
    if (this.selectedUser > -1) {
      this.mds.setSpinnerOn();
      this.bs.getWorkspacesByUser(this.selectedUser).subscribe(dataresponse => {
        this.WorkspacelistDatasource = new MatTableDataSource(dataresponse);
        this.mds.setSpinnerOff();
      });
    } else {
      this.WorkspacelistDatasource = null;
    }
  }

  selectWorkspace(ws: IdRoleData, role: string): void {
    if (ws.role === role) {
      ws.role = '';
    } else {
      ws.role = role;
    }
    this.pendingWorkspaceChanges = true;
  }

  saveWorkspaces(): void {
    this.pendingWorkspaceChanges = false;
    if (this.selectedUser > -1) {
      this.mds.setSpinnerOn();
      this.bs.setWorkspacesByUser(this.selectedUser, this.WorkspacelistDatasource.data).subscribe(
        respOk => {
          this.mds.setSpinnerOff();
          if (respOk !== false) {
            this.snackBar.open('Zugriffsrechte geändert', '', { duration: 1000 });
          } else {
            this.snackBar.open('Konnte Zugriffsrechte nicht ändern', 'Fehler', { duration: 2000 });
          }
        }
      );
    } else {
      this.WorkspacelistDatasource = null;
    }
  }

  updateObjectList(): void {
    this.tableselectionCheckbox.clear();
    this.tableselectionRow.clear();
    this.bs.getUsers().subscribe(dataresponse => {
      this.objectsDatasource = new MatTableDataSource(dataresponse);
      this.objectsDatasource.sort = this.sort;
      this.mds.setSpinnerOff();
    });
  }

  isAllSelected(): boolean {
    const numSelected = this.tableselectionCheckbox.selected.length;
    const numRows = this.objectsDatasource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.isAllSelected() ?
      this.tableselectionCheckbox.clear() :
      this.objectsDatasource.data.forEach(row => this.tableselectionCheckbox.select(row));
  }

  selectRow(row): void {
    this.tableselectionRow.select(row);
  }
}
