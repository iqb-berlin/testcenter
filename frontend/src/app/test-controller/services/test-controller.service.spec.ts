import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';

class MockBackendService {
}

let service: TestControllerService;

describe('TestControllerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestControllerService,
        {
          provide: BackendService,
          useValue: new MockBackendService()
        }
      ],
      imports: [
        RouterTestingModule,
        HttpClientModule
      ]
    })
      .compileComponents();
    service = TestBed.inject(TestControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should normaliseIds correctly', () => {
    expect(TestControllerService.normaliseId('file-Name-1.html')).toEqual('FILE-NAME-1.HTML');
    expect(TestControllerService.normaliseId('file-Name-2.1.1.html')).toEqual('FILE-NAME-2.1.1.HTML');
    expect(TestControllerService.normaliseId('file-Name3.html')).toEqual('FILE-NAME3.HTML');
    expect(TestControllerService.normaliseId('file-Name4.0.html')).toEqual('FILE-NAME4.0.HTML');
    expect(TestControllerService.normaliseId('file-Name5.0', 'html')).toEqual('FILE-NAME5.0.HTML');
    expect(TestControllerService.normaliseId('file-Name_6.gif', 'html')).toEqual('FILE-NAME_6.GIF.HTML');
    expect(TestControllerService.normaliseId('µðöþ7', 'html')).toEqual('ΜÐÖÞ7.HTML');
    expect(TestControllerService.normaliseId(' whatever  8.html')).toEqual('WHATEVER  8.HTML');
  });
});
