import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';
import { BackendService } from '../backend.service';
import { WorkspacesComponent } from './workspaces.component';
import { MainDataService } from '../../shared/shared.module';
import { IdAndName } from '../superadmin.interfaces';

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  getWorkspaces(): Observable<IdAndName[]> {
    return of([{ id: 1, name: 'a workspace' }]);
  }
}

describe('WorkspacesComponent', () => {
  let component: WorkspacesComponent;
  let fixture: ComponentFixture<WorkspacesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    declarations: [WorkspacesComponent],
    imports: [MatDialogModule,
        MatSnackBarModule,
        MatTableModule,
        MatCheckboxModule,
        MatIconModule],
    providers: [
        {
          provide: BackendService,
          useValue: new MockBackendService()
        },
        MainDataService,
        provideHttpClient(withInterceptorsFromDi())
    ]
})
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
