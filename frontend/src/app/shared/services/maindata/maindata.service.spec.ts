import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MainDataService } from './maindata.service';
import { BackendService } from '../backend.service';
import { AuthData } from '../../../app.interfaces';

class MockBackendService {
}

const storageKey = 'iqb-tc-a';

const storedAuthData: AuthData = {
  token: 'person-token',
  displayName: 'test',
  loginName: 'test',
  groupLabel: 'group',
  customTexts: {},
  flags: [],
  claims: {
    test: [],
    workspaceAdmin: [],
    superAdmin: [],
    workspaceMonitor: [],
    testGroupMonitor: [],
    attachmentManager: [],
    studyMonitor: [],
    sysCheck: [],
    review: []
  },
  groupToken: null,
  viewSettings: { theme: 'Sekundar' }
};

describe('MainDataService', () => {
  const createService = (): MainDataService => {
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
    return TestBed.inject(MainDataService);
  };

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('should be created', () => {
    expect(createService()).toBeTruthy();
  });

  it('starts with the login stored in localStorage', () => {
    localStorage.setItem(storageKey, JSON.stringify(storedAuthData));
    expect(createService().getAuthData()).toEqual(storedAuthData);
  });

  it('starts without login when nothing is stored', () => {
    expect(createService().getAuthData()).toBeNull();
  });

  it('discards a stored login that lacks required fields', () => {
    localStorage.setItem(storageKey, JSON.stringify({ ...storedAuthData, viewSettings: undefined }));
    expect(createService().getAuthData()).toBeNull();
  });

  it('discards a stored login that is no valid JSON', () => {
    localStorage.setItem(storageKey, '{broken');
    expect(createService().getAuthData()).toBeNull();
  });

  it('counts nobody as test taker when nobody is logged in', () => {
    expect(createService().isTestTaker()).toBeFalse();
  });

  it('counts logins whose code is not yet entered as test takers', () => {
    localStorage.setItem(storageKey, JSON.stringify({ ...storedAuthData, claims: {} }));
    expect(createService().isTestTaker()).toBeTrue();
  });

  it('does not count group monitors that may also run tests as test takers', () => {
    localStorage.setItem(storageKey, JSON.stringify({ ...storedAuthData, claims: { test: [], testGroupMonitor: [] } }));
    expect(createService().isTestTaker()).toBeFalse();
  });
});
