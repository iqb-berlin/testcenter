// eslint-disable-next-line max-classes-per-file
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
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
      declarations: [
        ReportComponent
      ],
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        MatCardModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: BackendService,
          useClass: MockBackendService
        },
        {
          provide: MainDataService,
          useValue: MockMainDataService
        }
      ]
    })
      .compileComponents();
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
