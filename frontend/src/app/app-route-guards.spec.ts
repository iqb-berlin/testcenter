import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NavigationBehaviorOptions, provideRouter, Router, Routes
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { MainDataService } from './shared/shared.module';
import { BackendService } from './backend.service';
import { AccessObject, AuthData, AuthFlagType } from './app.interfaces';
import {
  AdminComponentActivateGuard,
  CodeInputComponentActivateGuard,
  DirectLoginActivateGuard,
  GroupMonitorActivateGuard,
  RouteDispatcherActivateGuard,
  StarterActivateGuard,
  StudyMonitorActivateGuard,
  SuperAdminComponentActivateGuard,
  TestComponentActivateGuard
} from './app-route-guards';

@Component({ template: '' })
class RoutedComponent {}

const routes: Routes = [
  { path: 'guarded/dispatcher', component: RoutedComponent, canActivate: [RouteDispatcherActivateGuard] },
  { path: 'guarded/code-input', component: RoutedComponent, canActivate: [CodeInputComponentActivateGuard] },
  { path: 'guarded/starter', component: RoutedComponent, canActivate: [StarterActivateGuard] },
  { path: 'guarded/admin', component: RoutedComponent, canActivate: [AdminComponentActivateGuard] },
  { path: 'guarded/superadmin', component: RoutedComponent, canActivate: [SuperAdminComponentActivateGuard] },
  { path: 'guarded/test', component: RoutedComponent, canActivate: [TestComponentActivateGuard] },
  { path: 'guarded/gm', component: RoutedComponent, canActivate: [GroupMonitorActivateGuard] },
  { path: 'guarded/sm', component: RoutedComponent, canActivate: [StudyMonitorActivateGuard] },
  { path: 'r', children: [{ path: '**', component: RoutedComponent }] },
  { path: 't', children: [{ path: '**', component: RoutedComponent }] },
  { path: 'check', children: [{ path: '**', component: RoutedComponent }] },
  { path: '**', component: RoutedComponent, canActivate: [DirectLoginActivateGuard] }
];

function createAccess(id: string): AccessObject {
  return {
    id, label: id, type: '', flags: {}, workspaceId: '7', description: ''
  };
}

function createAuthData(claims: AuthData['claims'], flags: AuthFlagType[] = []): AuthData {
  return {
    token: 'token',
    displayName: '',
    loginName: '',
    groupLabel: '',
    customTexts: {},
    flags,
    claims,
    groupToken: null,
    viewSettings: {}
  };
}

describe('App route guards', () => {
  let authData: AuthData | null;
  let mainDataService: jasmine.SpyObj<MainDataService>;
  let backendService: jasmine.SpyObj<BackendService>;
  let router: Router;

  // Navigates to url, optionally after a first navigation to previousUrl, and returns where it ended up.
  async function navigate(url: string, previousUrl?: string): Promise<string> {
    await RouterTestingHarness.create(previousUrl);
    await router.navigateByUrl(url);
    return router.url;
  }

  beforeEach(() => {
    authData = null;
    mainDataService = jasmine.createSpyObj<MainDataService>('MainDataService', ['getAuthData', 'setAuthData']);
    mainDataService.getAuthData.and.callFake(() => authData);
    backendService = jasmine.createSpyObj<BackendService>('BackendService', ['startTest', 'login']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: MainDataService, useValue: mainDataService },
        { provide: BackendService, useValue: backendService },
        RouteDispatcherActivateGuard,
        DirectLoginActivateGuard
      ]
    });
    router = TestBed.inject(Router);
  });

  describe('route dispatcher', () => {
    it('sends to the login without auth data', async () => {
      expect(await navigate('/guarded/dispatcher')).toBe('/r/login/');
    });

    it('sends to the code input if a code is required', async () => {
      authData = createAuthData({ test: [createAccess('b1')] }, ['codeRequired']);

      expect(await navigate('/guarded/dispatcher')).toBe('/r/code-input');
    });

    it('starts the only test right away on the first navigation', async () => {
      authData = createAuthData({ test: [createAccess('b1')] });
      backendService.startTest.and.returnValue(of(42));

      expect(await navigate('/guarded/dispatcher')).toBe('/t/42');
      expect(backendService.startTest).toHaveBeenCalledOnceWith('b1');
    });

    it('starts the only sys-check right away on the first navigation', async () => {
      authData = createAuthData({ sysCheck: [createAccess('sc1')] });

      expect(await navigate('/guarded/dispatcher')).toBe('/check/7/sc1');
    });

    it('sends to the starter if the only test is not reached by the first navigation', async () => {
      authData = createAuthData({ test: [createAccess('b1')] });

      expect(await navigate('/guarded/dispatcher', '/r/somewhere')).toBe('/r/starter');
      expect(backendService.startTest).not.toHaveBeenCalled();
    });

    it('sends to the starter if there is more than one test', async () => {
      authData = createAuthData({ test: [createAccess('b1'), createAccess('b2')] });

      expect(await navigate('/guarded/dispatcher')).toBe('/r/starter');
    });

    it('sends to the starter if there are other claims besides the only test', async () => {
      authData = createAuthData({ test: [createAccess('b1')], sysCheck: [createAccess('sc1')] });

      expect(await navigate('/guarded/dispatcher')).toBe('/r/starter');
    });

    it('keeps the navigation extras when sending to the starter', async () => {
      authData = createAuthData({ workspaceAdmin: [createAccess('ws1')] });
      const extras: NavigationBehaviorOptions = { state: { origin: 'login' } };
      await RouterTestingHarness.create();

      await router.navigateByUrl('/guarded/dispatcher', extras);

      expect(router.url).toBe('/r/starter');
      expect(router.lastSuccessfulNavigation?.extras.state).toEqual({ origin: 'login' });
    });
  });

  describe('direct login', () => {
    it('logs in with the path as login name and sends to the dispatcher', async () => {
      const loginAuthData = createAuthData({ test: [createAccess('b1')] });
      backendService.login.and.returnValue(of(loginAuthData));

      expect(await navigate('/some-login')).toBe('/r');
      expect(backendService.login).toHaveBeenCalledOnceWith('some-login');
      expect(mainDataService.setAuthData).toHaveBeenCalledOnceWith(loginAuthData);
    });

    it('does not log in for paths with more than one segment', async () => {
      expect(await navigate('/some-login/more')).toBe('/some-login/more');
      expect(backendService.login).not.toHaveBeenCalled();
    });
  });

  describe('code input guard', () => {
    it('lets through if a code is required', async () => {
      authData = createAuthData({}, ['codeRequired']);

      expect(await navigate('/guarded/code-input')).toBe('/guarded/code-input');
    });

    it('sends to the dispatcher if no code is required', async () => {
      authData = createAuthData({});

      expect(await navigate('/guarded/code-input')).toBe('/r');
    });
  });

  describe('starter guard', () => {
    it('lets through with auth data', async () => {
      authData = createAuthData({});

      expect(await navigate('/guarded/starter')).toBe('/guarded/starter');
    });

    it('sends to the dispatcher without auth data', async () => {
      expect(await navigate('/guarded/starter')).toBe('/r');
    });
  });

  describe('claim guards', () => {
    const cases: [string, keyof AuthData['claims']][] = [
      ['/guarded/admin', 'workspaceAdmin'],
      ['/guarded/superadmin', 'superAdmin'],
      ['/guarded/test', 'test'],
      ['/guarded/gm', 'testGroupMonitor'],
      ['/guarded/sm', 'studyMonitor']
    ];

    cases.forEach(([url, claim]) => {
      it(`lets through to ${url} with the claim ${claim}`, async () => {
        authData = createAuthData({ [claim]: [createAccess('x')] });

        expect(await navigate(url)).toBe(url);
      });

      it(`sends from ${url} to the dispatcher without the claim ${claim}`, async () => {
        authData = createAuthData({ sysCheck: [createAccess('x')] });

        expect(await navigate(url)).toBe('/r');
      });

      it(`sends from ${url} to the dispatcher without auth data`, async () => {
        expect(await navigate(url)).toBe('/r');
      });
    });
  });
});
