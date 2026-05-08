// eslint-disable-next-line max-classes-per-file
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportComponent } from './report.component';
import { BackendService } from '../backend.service';
import { MainDataService } from '../../shared/services/maindata/maindata.service';

class MockBackendService {

}

class MockMainDataService {

}

describe('ReportComponent', () => {
  let component: ReportComponent;
  let fixture: ComponentFixture<ReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReportComponent, MatDialogModule, MatCardModule, RouterTestingModule],
      providers: [
        {
          provide: BackendService,
          useClass: MockBackendService
        },
        {
          provide: MainDataService,
          useValue: MockMainDataService
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
