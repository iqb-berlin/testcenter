// eslint-disable-next-line max-classes-per-file
import { TestBed, inject } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkspaceDataService } from './workspacedata.service';
import { BackendService } from './backend.service';

class MockMatDialog {
  // eslint-disable-next-line class-methods-use-this
  open(): { afterClosed: () => Observable<{ action: boolean }> } {
    return {
      afterClosed: () => of({ action: true })
    };
  }
}

class MockBackendService {

}

describe('WorkspaceDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatSnackBarModule
      ],
      providers: [
        WorkspaceDataService,
        { provide: BackendService, useValue: new MockBackendService() },
        { provide: MatDialog, useValue: new MockMatDialog() }
      ]
    });
  });

  it('should be created', inject([WorkspaceDataService], (service: WorkspaceDataService) => {
    expect(service).toBeTruthy();
  }));
});
