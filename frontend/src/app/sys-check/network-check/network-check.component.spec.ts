import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NetworkCheckComponent } from './network-check.component';
import { BackendService } from '../backend.service';
import { TcSpeedChartComponent } from './tc-speed-chart.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

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
    imports: [MatCardModule],
    providers: [
        {
            provide: BackendService,
            useClass: MockBackendService
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
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
