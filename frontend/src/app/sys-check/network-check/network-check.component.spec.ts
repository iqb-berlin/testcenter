import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NetworkCheckComponent } from './network-check.component';
import { BackendService } from '../backend.service';
import { TcSpeedChartComponent } from './tc-speed-chart.component';

class MockBackendService {

}

describe('NetworkCheckComponent', () => {
  let component: NetworkCheckComponent;
  let fixture: ComponentFixture<NetworkCheckComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        NetworkCheckComponent,
        TcSpeedChartComponent
      ],
      imports: [
        HttpClientTestingModule,
        MatCardModule
      ],
      providers: [
        {
          provide: BackendService,
          useClass: MockBackendService
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
