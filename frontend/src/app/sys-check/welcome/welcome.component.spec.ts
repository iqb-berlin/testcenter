import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Observable, of } from 'rxjs';
import { WelcomeComponent } from './welcome.component';
import { BackendService } from '../backend.service';
import { ServerTime } from '../sys-check.interfaces';

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  getServerTime(): Observable<ServerTime> {
    return of({
      timestamp: 0,
      timezone: ''
    });
  }
}

describe('WelcomeComponent', () => {
  let component: WelcomeComponent;
  let fixture: ComponentFixture<WelcomeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        WelcomeComponent
      ],
      imports: [
        MatCardModule,
        HttpClientTestingModule
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
    fixture = TestBed.createComponent(WelcomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
