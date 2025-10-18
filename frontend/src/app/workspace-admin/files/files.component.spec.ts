// eslint-disable max-classes-per-file
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MainDataService, SharedModule } from '../../shared/shared.module';
import { FilesComponent } from './files.component';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { GetFileResponseData } from '../workspace.interfaces';
import { IqbFilesUploadQueueComponent } from './iqb-files-upload-queue/iqb-files-upload-queue.component';
import { IqbFilesUploadInputForDirective } from './iqb-files-upload-input-for/iqb-files-upload-input-for.directive';

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  getFiles(): Observable<GetFileResponseData> {
    return of({
      Unit: [],
      Testtakers: [],
      SysCheck: [],
      Booklet: [],
      Resource: []
    });
  }
}

class MockMainDataService {}

describe('FilesComponent', () => {
  let component: FilesComponent;
  let fixture: ComponentFixture<FilesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        FilesComponent,
        IqbFilesUploadQueueComponent,
        IqbFilesUploadInputForDirective
    ],
    imports: [MatExpansionModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTableModule,
        MatIconModule,
        MatCheckboxModule,
        SharedModule,
        NoopAnimationsModule],
    providers: [
        {
          provide: BackendService,
          useValue: new MockBackendService()
        },
        {
          provide: MainDataService,
          useValue: new MockMainDataService()
        },
        WorkspaceDataService,
        provideHttpClient(withInterceptorsFromDi())
    ]
})
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
