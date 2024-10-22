import { MatTableDataSource } from '@angular/material/table';
import { ViewChild, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import {
  ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData
} from '../../shared/shared.module';
import { IdRoleData, UserData } from '../superadmin.interfaces';
import {
  SuperadminPasswordRequestComponent
} from '../superadmin-password-request/superadmin-password-request.component';
import { BackendService } from '../backend.service';
import { NewUserComponent } from './newuser/new-user.component';
import { PasswordChangeService } from '../../shared/services/password-change/password-change.service';

@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  objectsDatasource: MatTableDataSource<UserData> = new MatTableDataSource<UserData>();
  displayedColumns = ['name'];
  tableSelectionRow = new SelectionModel<UserData>(false, []);
  selectedUser = -1;
  selectedUserName = '';

  pendingWorkspaceChanges = false;
  workspacelistDatasource: MatTableDataSource<IdRoleData> = new MatTableDataSource<IdRoleData>();
  displayedWorkspaceColumns = ['selectCheckbox', 'label'];

  @ViewChild(MatSort) sort: MatSort = new MatSort();

  constructor(
    private bs: BackendService,
    private newuserDialog: MatDialog,
    private confirmDialog: MatDialog,
    private superadminPasswordDialog: MatDialog,
    private messsageDialog: MatDialog,
    private snackBar: MatSnackBar,
    private newpasswordService: PasswordChangeService
  ) {
    this.tableSelectionRow.changed.subscribe(
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
      this.updateObjectList();
    });
  }

  addObject(): void {
    const dialogRef = this.newuserDialog.open(NewUserComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (typeof result !== 'undefined') {
        if (result !== false) {
          this.bs
            .addUser(result.get('name').value, result.get('pw').value)
            .subscribe(() => { this.updateObjectList(); });
        }
      }
    });
  }

  changeSuperadminStatus(): void {
    const selectedRows = this.tableSelectionRow.selected;
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Superadmin-Status ändern',
          content: 'Bitte markieren Sie erst eine Administrator:in!',
          type: 'error'
        }
      });
      return;
    }

    const userObject = <UserData>selectedRows[0];
    const passwdDialogRef = this.superadminPasswordDialog.open(SuperadminPasswordRequestComponent, {
      width: '600px',
      data: `Superadmin-Status ${userObject.isSuperadmin ? 'entziehen' : 'setzen'}`
    });

    passwdDialogRef.afterClosed().subscribe(afterClosedResult => {
      if (!afterClosedResult) {
        return;
      }
      this.bs.setSuperUserStatus(
        selectedRows[0].id,
        !userObject.isSuperadmin,
        afterClosedResult.get('pw').value
      )
        .subscribe(() => {
          this.snackBar.open('Status geändert', '', { duration: 1000 });
          this.updateObjectList();
        });
    });
  }

  changePassword(): void {
    const selectedRows = this.tableSelectionRow.selected;
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Kennwort ändern',
          content: 'Bitte markieren Sie erst eine Administrator:in!',
          type: 'error'
        }
      });
    } else {
      this.newpasswordService.showPasswordChangeDialog(selectedRows[0]).subscribe(respOk => {
        if (!respOk) {
          this.snackBar.open('Kennwort geändert', '', { duration: 3000 });
        }
      });
    }
  }

  deleteObject(): void {
    const selectedRows = this.tableSelectionRow.selected;
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {

        width: '400px',
        data: <MessageDialogData>{
          title: 'Löschen von Administrator:innen',
          content: 'Bitte markieren Sie erst eine Administrator:in!',
          type: 'error'
        }
      });
    } else {
      let prompt;
      if (selectedRows.length > 1) {
        prompt = `Sollen ${selectedRows.length} Administrator:innen gelöscht werden?`;
      } else {
        prompt = `Soll Administrator:in "${selectedRows[0].name}" gelöscht werden?`;
      }
      const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Administrator:innen',
          content: prompt,
          confirmbuttonlabel: 'Administrator:in löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          const usersToDelete: string[] = [];
          selectedRows.forEach((r: UserData) => usersToDelete.push(r.id.toString(10)));
          this.bs.deleteUsers(usersToDelete).subscribe(
            () => {
              this.snackBar.open('Administrator:in gelöscht', '', { duration: 1000 });
              this.updateObjectList();
            }
          );
        }
      });
    }
  }

  updateWorkspaceList(): void {
    this.pendingWorkspaceChanges = false;
    if (this.selectedUser > -1) {
      this.workspacelistDatasource = new MatTableDataSource<IdRoleData>();
      this.bs.getWorkspacesByUser(this.selectedUser)
        .subscribe(dataresponse => {
          this.workspacelistDatasource = new MatTableDataSource(dataresponse);
        });
    }
  }

  selectPermissions(user: IdRoleData, role: string): void {
    if (role === 'RW') {
      user.role = (user.role === 'RW') ? 'RO' : 'RW';
    } else if (role === 'RO') {
      user.role = (user.role === 'RO' || user.role === 'RW') ? '' : 'RO';
    }
    this.pendingWorkspaceChanges = true;
  }

  saveWorkspaces(): void {
    this.pendingWorkspaceChanges = false;
    if (this.selectedUser > -1) {
      this.bs.setWorkspacesByUser(this.selectedUser, this.workspacelistDatasource.data)
        .subscribe(() => {
          this.snackBar.open('Zugriffsrechte geändert', '', { duration: 1000 });
        });
    } else {
      this.workspacelistDatasource = new MatTableDataSource<IdRoleData>();
    }
  }

  updateObjectList(): void {
    this.tableSelectionRow.clear();
    this.bs.getUsers().subscribe(dataresponse => {
      this.objectsDatasource = new MatTableDataSource(dataresponse);
      this.objectsDatasource.sort = this.sort;
    });
  }

  selectRow(row: UserData): void {
    this.tableSelectionRow.select(row);
  }
}
