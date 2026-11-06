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
import { AlertComponent, MainDataService, SharedModule } from '../../shared/shared.module';import { FilesComponent } from './files.component';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { GetFileResponseData, IQBFile } from '../workspace.interfaces';
import { IqbFilesUploadQueueComponent } from './iqb-files-upload-queue/iqb-files-upload-queue.component';
import { IqbFilesUploadInputForDirective } from './iqb-files-upload-input-for/iqb-files-upload-input-for.directive';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatProgressSpinner, MatSpinner } from '@angular/material/progress-spinner';

class MockBackendService {
  files: GetFileResponseData = {
    Unit: [],
    Testtakers: [],
    SysCheck: [],
    Booklet: [],
    Resource: []
  };

  getFiles(): Observable<GetFileResponseData> {
    return of(this.files);
  }

  getFilesWithDependencies(): Observable<GetFileResponseData> {
    return of(this.files);
  }
}

const appConfig = {
  veronaPlayerApiVersionMin: 2,
  veronaPlayerApiVersionMax: 6,
  xmlSchemaVersions: {
    Booklet: { min: 18, max: 18 },
    Testtakers: { min: 17, max: 18 }
  }
};

class MockMainDataService {
  appConfig = appConfig;
  appConfig$ = of(appConfig);
}

function createResource(name: string, veronaModuleType: string, veronaVersion: string): IQBFile {
  return {
    name,
    size: 1,
    modificationTime: '',
    type: 'Resource',
    isChecked: false,
    dependencies: [],
    report: { error: [], warning: [], info: [] },
    info: { veronaModuleType, veronaVersion }
  };
}

describe('FilesComponent', () => {
  let component: FilesComponent;
  let fixture: ComponentFixture<FilesComponent>;
  let backendService: MockBackendService;

  beforeEach(waitForAsync(() => {
    backendService = new MockBackendService();
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
        MatProgressSpinner,
        SharedModule,
        NoopAnimationsModule,
        MatIconTestingModule,
        AlertComponent
      ],
      providers: [
        {
          provide: BackendService,
          useValue: backendService
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

  it('should list the supported versions of schemas and Verona', () => {
    expect(component.supportedVersions).toEqual([
      { label: 'Teilnehmerlisten', versions: '17–18' },
      { label: 'Testhefte', versions: '18' },
      { label: 'Verona-Player', versions: '2–6' }
    ]);
  });

  it('should check only players against the supported Verona versions', () => {
    backendService.files.Resource = [
      createResource('player.html', 'player', '7.0'),
      createResource('widget.html', 'widget', '1.0')
    ];

    component.updateFileList();

    const [player, widget] = component.files.Resource.data;
    expect(player.report.error).toEqual([jasmine.stringMatching('Verona Version `7` is not supported')]);
    expect(widget.report.error).toEqual([]);
  });
});
