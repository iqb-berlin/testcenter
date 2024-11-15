import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MainDataService } from './maindata.service';
import { BackendService } from '../backend.service';

class MockBackendService {
}

describe('MainDataService', () => {
  let service: MainDataService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MainDataService,
        {
          provide: BackendService,
          useValue: new MockBackendService()
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
    });
    service = TestBed.inject(MainDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
