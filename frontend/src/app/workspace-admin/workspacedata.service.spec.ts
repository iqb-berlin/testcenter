// eslint-disable-next-line max-classes-per-file
import { TestBed, inject } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkspaceDataService } from './workspacedata.service';
import { BackendService } from './backend.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MessageService } from '@shared/services/message.service';

class MockMatDialog {
  // eslint-disable-next-line class-methods-use-this
  open(): { afterClosed: () => Observable<{ action: boolean }> } {
    return {
      afterClosed: () => of({ action: true })
    };
  }
}

class MockService { }

describe('WorkspaceDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatSnackBarModule
      ],
      providers: [
        WorkspaceDataService,
        { provide: BackendService, useValue: new MockService() },
        { provide: MessageService, useValue: new MockService() },
        { provide: MatDialog, useValue: new MockMatDialog() },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
  });

  it('should be created', inject([WorkspaceDataService], (service: WorkspaceDataService) => {
    expect(service).toBeTruthy();
  }));
});
