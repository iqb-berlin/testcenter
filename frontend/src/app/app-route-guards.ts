import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { MainDataService } from './shared/shared.module';
import { AuthAccessType, getSoleAccess } from './app.interfaces';
import { BackendService } from './backend.service';

export const routeDispatcherGuard: CanActivateFn = () => {
  const router = inject(Router);
  const backendService = inject(BackendService);
  const authData = inject(MainDataService).getAuthData();

  if (!authData) {
    return router.createUrlTree(['/r/login', '']);
  }

  if (authData.flags.includes('codeRequired')) {
    return router.createUrlTree(['/r/code-input']);
  }

  // A login with a single test or sys-check starts it right away instead of showing the starter,
  // but only on the first navigation, e.g. after a direct login (see directLoginGuard).
  if (router.currentNavigation()?.previousNavigation === null) {
    const test = getSoleAccess(authData, 'test');
    if (test) {
      return backendService.startTest(test.id)
        .pipe(map(testId => router.createUrlTree(['/t', testId])));
    }
    const sysCheck = getSoleAccess(authData, 'sysCheck');
    if (sysCheck) {
      return router.createUrlTree(['/check', sysCheck.workspaceId, sysCheck.id]);
    }
  }

  // A RedirectCommand keeps the NavigationBehaviorOptions of the current navigation,
  // which createUrlTree() alone would drop.
  return new RedirectCommand(router.createUrlTree(['/r/starter']), router.currentNavigation()?.extras);
};

// url/#/<login name> logs in directly, for logins without password. Any other unknown url
// passes through to the page-not-found route.
export const directLoginGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const mainDataService = inject(MainDataService);
  const backendService = inject(BackendService);
  const loginName = state.url.substring(1);

  if (!loginName || loginName.includes('/')) {
    return true;
  }

  return backendService.login(loginName)
    .pipe(map(authData => {
      mainDataService.setAuthData(authData);
      return router.createUrlTree(['/r']);
    }));
};

export const codeInputGuard: CanActivateFn = () => {
  const authData = inject(MainDataService).getAuthData();
  if (authData?.flags.includes('codeRequired')) {
    return true;
  }
  return inject(Router).createUrlTree(['/r']);
};

export const starterGuard: CanActivateFn = () => {
  const authData = inject(MainDataService).getAuthData();
  if (authData) {
    return true;
  }
  return inject(Router).createUrlTree(['/r']);
};

export function createClaimGuard(accessType: AuthAccessType): CanActivateFn {
  return () => {
    const authData = inject(MainDataService).getAuthData();
    if (authData?.claims[accessType]) {
      return true;
    }
    return inject(Router).createUrlTree(['/r']);
  };
}
