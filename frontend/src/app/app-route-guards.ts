// eslint-disable-next-line max-classes-per-file
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, RedirectCommand, Router, RouterStateSnapshot, UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MainDataService } from './shared/shared.module';
import { AuthData } from './app.interfaces';
import { BackendService } from './backend.service';

// TODO put classes in separate files and clean up absurd if-ceptions

@Injectable()
export class RouteDispatcherActivateGuard {
  constructor(private router: Router, private mainDataService: MainDataService,
              private backendService: BackendService) { }

  canActivate() {
    const authData = this.mainDataService.getAuthData();
    if (!authData) {
      return this.router.createUrlTree(['/r/login', '']);
    }

    if (authData.flags.indexOf('codeRequired') >= 0) {
      return this.router.createUrlTree(['/r/code-input']);
    }

    if (
      authData.claims &&
      Object.keys(authData.claims).length === 1 &&
      authData.claims.test &&
      authData.claims.test.length === 1 &&
      this.router.getCurrentNavigation()?.previousNavigation === null
    ) {
      return this.backendService.startTest(authData.claims.test[0].id)
        .pipe(map(testId => this.router.createUrlTree(['/t', testId])));
    }

    if (
      authData.claims &&
      Object.keys(authData.claims).length === 1 &&
      authData.claims.sysCheck &&
      authData.claims.sysCheck.length === 1 &&
      this.router.getCurrentNavigation()?.previousNavigation === null
    ) {
      return this.router.createUrlTree([
        '/check',
        authData.claims.sysCheck[0].workspaceId,
        authData.claims.sysCheck[0].id
      ]);
    }

    // RedirectCommand is necessary as we want to maintain context of type NavigationBehaviorOptions, which createURLTree()
    // does not take in; it only uses UrlCreationOptions
    return new RedirectCommand(
      this.router.createUrlTree(['/r/starter']),
      this.router.getCurrentNavigation()?.extras
    );
  }
}

@Injectable()
export class DirectLoginActivateGuard {
  constructor(private mds: MainDataService, private bs: BackendService, private router: Router) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const name = state.url.substr(1);
    if (name.length > 0 && name.indexOf('/') < 0) {
      return this.bs.login(name)
        .pipe(
          map((authDataResponse: AuthData) => {
            this.mds.setAuthData(authDataResponse as AuthData);
            return this.router.createUrlTree(['/r']);
          })
        );
    }
    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class CodeInputComponentActivateGuard {
  constructor(private router: Router, private mainDataService: MainDataService) { }

  canActivate() {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.flags) {
        if (authData.flags.indexOf('codeRequired') >= 0) {
          return true;
        }
        return this.router.createUrlTree(['/r']);
      }
      return this.router.createUrlTree(['/r']);
    }
    return this.router.createUrlTree(['/r']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminComponentActivateGuard {
  constructor(private router: Router, private mainDataService: MainDataService) { }

  canActivate() {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.claims) {
        if (authData.claims.workspaceAdmin) {
          return true;
        }
        return this.router.createUrlTree(['/r']);
      }
      return this.router.createUrlTree(['/r']);
    }
    return this.router.createUrlTree(['/r']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrSuperAdminComponentActivateGuard {
  constructor(private router: Router, private mainDataService: MainDataService) { }

  canActivate() {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.claims) {
        if (authData.claims.workspaceAdmin || authData.claims.superAdmin) {
          return true;
        }
        return this.router.createUrlTree(['/r']);
      }
      return this.router.createUrlTree(['/r']);
    }
    return this.router.createUrlTree(['/r']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SuperAdminComponentActivateGuard {
  constructor(private router: Router, private mainDataService: MainDataService) { }

  canActivate() {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.claims) {
        if (authData.claims.superAdmin) {
          return true;
        }
        return this.router.createUrlTree(['/r']);
      }
      return this.router.createUrlTree(['/r']);
    }
    return this.router.createUrlTree(['/r']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class TestComponentActivateGuard {
  constructor(private router: Router, private mainDataService: MainDataService) { }

  canActivate() {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.claims) {
        if (authData.claims.test) {
          return true;
        }
        return this.router.createUrlTree(['/r']);
      }
      return this.router.createUrlTree(['/r']);
    }
    return this.router.createUrlTree(['/r']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class GroupMonitorActivateGuard {
  constructor(private router: Router, private mainDataService: MainDataService) { }

  canActivate() {
    const authData = this.mainDataService.getAuthData();

    if (authData && authData.claims && authData.claims.testGroupMonitor) {
      return true;
    }
    return this.router.createUrlTree(['/r']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class StarterActivateGuard {
  constructor(private router: Router, private mainDataService: MainDataService) { }

  canActivate() {
    const authData = this.mainDataService.getAuthData();

    if (authData) {
      return true;
    }
    return this.router.createUrlTree(['/r']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class StudyMonitorActivateGuard {
  constructor(private router: Router, private mainDataService: MainDataService) { }

  canActivate() {
    const authData = this.mainDataService.getAuthData();

    if (authData && authData.claims && authData.claims.studyMonitor) {
      return true;
    }

    return this.router.createUrlTree(['/r']);
  }
}
