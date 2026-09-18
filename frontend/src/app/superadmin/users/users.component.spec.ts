// eslint-disable-next-line max-classes-per-file
import {
  ComponentFixture, fakeAsync, TestBed, tick, waitForAsync
} from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import {
  Observable, of, Subject, throwError
} from 'rxjs';
import { MessageService } from '@shared/services/message.service';
import { BackendService } from '../backend.service';
import { UsersComponent } from './users.component';
import { MainDataService, PasswordChangeService } from '../../shared/shared.module';
import { IdRoleData, UserData } from '../superadmin.interfaces';

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  getUsers(): Observable<UserData[]> {
    return of([{
      id: 0,
      name: 'agent 00',
      email: 'agent@doublezero.de',
      isSuperadmin: true,
      selected: true
    }]);
  }

  // eslint-disable-next-line class-methods-use-this
  setSuperUserStatus(): Observable<void> {
    return of(undefined);
  }

  // eslint-disable-next-line class-methods-use-this
  getWorkspacesByUser(): Observable<IdRoleData[]> {
    return of([]);
  }
}

class MockPasswordChangeService {
  // eslint-disable-next-line class-methods-use-this
  showPasswordChangeDialog(): void { }
}

class MockService {
  // eslint-disable-next-line class-methods-use-this
  showSnackbar(): Observable<void> {
    return of(undefined);
  }
}

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UsersComponent],
      imports: [
        MatDialogModule,
        MatSnackBarModule,
        MatTableModule,
        MatCheckboxModule,
        MatIconModule,
        MatIconTestingModule
      ],
      providers: [
        {
          provide: BackendService,
          useValue: new MockBackendService()
        },
        {
          provide: PasswordChangeService,
          useValue: new MockPasswordChangeService()
        },
        { provide: MessageService, useValue: new MockService() },
        MainDataService,
        provideHttpClient(withInterceptorsFromDi())
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('changeSuperadminStatus', () => {
    let fakeDialogRef: {
      componentInstance: { passwordSubmit: Subject<string>; errorMessage: string };
      close: jasmine.Spy;
    };
    let dialogOpenSpy: jasmine.Spy;
    let bs: BackendService;
    const userObject: UserData = {
      id: 7, name: 'agent 07', email: 'agent@seven.de', isSuperadmin: false, selected: false
    };

    beforeEach(() => {
      fakeDialogRef = {
        componentInstance: { passwordSubmit: new Subject<string>(), errorMessage: '' },
        close: jasmine.createSpy('close')
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dialogOpenSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(fakeDialogRef as any);
      bs = TestBed.inject(BackendService);
      component.selectRow(userObject);
    });

    it('should do nothing if no row is selected', () => {
      component.tableSelectionRow.clear();
      component.changeSuperadminStatus();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should open the password dialog for the selected row', () => {
      component.changeSuperadminStatus();
      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should close the dialog, show a snackbar and refresh the list on success', () => {
      spyOn(bs, 'setSuperUserStatus').and.returnValue(of(undefined));
      const snackbarSpy = spyOn(TestBed.inject(MessageService), 'showSnackbar').and.callThrough();
      const updateSpy = spyOn(component, 'updateObjectList');

      component.changeSuperadminStatus();
      fakeDialogRef.componentInstance.passwordSubmit.next('correct-horse');

      expect(fakeDialogRef.close).toHaveBeenCalled();
      expect(snackbarSpy).toHaveBeenCalledWith('Status geändert');
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should keep the dialog open and show an inline error on a wrong password (403)', () => {
      spyOn(bs, 'setSuperUserStatus').and.returnValue(throwError(() => ({ code: 403 })));

      component.changeSuperadminStatus();
      fakeDialogRef.componentInstance.passwordSubmit.next('wrong-password');

      expect(fakeDialogRef.close).not.toHaveBeenCalled();
      expect(fakeDialogRef.componentInstance.errorMessage).toBe('Falsches Kennwort.');
    });

    it('should not swallow unexpected errors - they must still reach the global error handler', fakeAsync(() => {
      spyOn(bs, 'setSuperUserStatus').and.returnValue(throwError(() => ({ code: 500 })));

      component.changeSuperadminStatus();
      fakeDialogRef.componentInstance.passwordSubmit.next('correct-horse');

      expect(() => tick()).toThrow();
      expect(fakeDialogRef.close).not.toHaveBeenCalled();
      expect(fakeDialogRef.componentInstance.errorMessage).toBe('');
    }));
  });
});
