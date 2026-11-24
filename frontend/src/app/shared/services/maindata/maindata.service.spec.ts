import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MainDataService } from './maindata.service';
import { BackendService } from '../backend.service';
import { AuthData } from '../../../app.interfaces';

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

  describe('isTestTaker', () => {
    const loginWithClaims = (claims: object): void => {
      spyOn(service, 'getAuthData').and.returnValue(<AuthData>{ claims });
    };

    it('is false when nobody is logged in', () => {
      spyOn(service, 'getAuthData').and.returnValue(null);
      expect(service.isTestTaker()).toBeFalse();
    });

    it('is true for logins with tests only', () => {
      loginWithClaims({ test: [] });
      expect(service.isTestTaker()).toBeTrue();
    });

    it('is true for logins whose code is not yet entered', () => {
      loginWithClaims({});
      expect(service.isTestTaker()).toBeTrue();
    });

    it('is false for group monitors that may also run tests', () => {
      loginWithClaims({ test: [], testGroupMonitor: [] });
      expect(service.isTestTaker()).toBeFalse();
    });

    it('is false for admins', () => {
      loginWithClaims({ workspaceAdmin: [] });
      expect(service.isTestTaker()).toBeFalse();
    });
  });
});
