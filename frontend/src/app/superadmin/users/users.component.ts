import { MatTableDataSource } from '@angular/material/table';
import { ViewChild, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MessageService } from '@shared/services/message.service';
import { PasswordChangeService } from '../../shared/shared.module';
import { IdRoleData, UserData } from '../superadmin.interfaces';
import {
  SuperadminPasswordRequestComponent
} from '../superadmin-password-request/superadmin-password-request.component';
import { BackendService } from '../backend.service';
import { NewUserComponent } from './newuser/new-user.component';

@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  standalone: false
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
    private messageService: MessageService,
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
    this.updateObjectList();
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
          this.messageService.showInfo('Status geändert');
          this.updateObjectList();
        });
    });
  }

  changePassword(): void {
    const selectedRows = this.tableSelectionRow.selected;
    if (selectedRows.length === 0) {
      return;
    }
    this.newpasswordService.showPasswordChangeDialog(selectedRows[0])
      .subscribe(result => {
        if (result) {
          this.messageService.showInfo('Kennwort geändert');
        }
      });
  }

  deleteAdminUser(): void {
    const selectedRows = this.tableSelectionRow.selected;
    if (selectedRows.length === 0) {
      return; // this should be reachable because the button is disabled
    }
    const prompt = selectedRows.length > 1 ?
      `Sollen ${selectedRows.length} Administrator:innen gelöscht werden?` :
      `Soll Administrator:in "${selectedRows[0].name}" gelöscht werden?`;
    this.messageService.showDialog({
      title: 'Löschen von Administrator:innen',
      content: prompt,
      confirmText: 'Administrator:in löschen',
      focusCancel: true
    }).subscribe(result => {
      if (result) {
        const usersToDelete: string[] = [];
        selectedRows.forEach((r: UserData) => usersToDelete.push(r.id.toString(10)));
        this.bs.deleteUsers(usersToDelete).subscribe(
          () => {
            this.messageService.showInfo('Administrator:in gelöscht');
            this.updateObjectList();
          }
        );
      }
    });
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
          this.messageService.showInfo('Zugriffsrechte geändert');
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
