import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Observable, of } from 'rxjs';
import { ResultsComponent } from './results.component';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { ResultData } from '../workspace.interfaces';

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  getResultData(): Observable<ResultData[]> {
    return of([{
      groupName: 'a_group',
      groupLabel: 'A Group',
      bookletsStarted: 5,
      numUnitsMin: 5,
      numUnitsMax: 10,
      numUnitsAvg: 7.5,
      lastChange: 100080050
    }]);
  }
}

describe('ResultsComponent', () => {
  let component: ResultsComponent;
  let fixture: ComponentFixture<ResultsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    declarations: [ResultsComponent],
    imports: [MatDialogModule,
        MatSnackBarModule,
        MatIconModule,
        MatTableModule,
        MatCheckboxModule],
    providers: [
        {
          provide: BackendService,
          useValue: new MockBackendService()
        },
        WorkspaceDataService,
        provideHttpClient(withInterceptorsFromDi())
    ]
})
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
