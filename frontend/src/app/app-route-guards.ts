// eslint-disable-next-line max-classes-per-file
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MainDataService } from './shared/shared.module';
import { AuthData } from './app.interfaces';
import { BackendService } from './backend.service';

// TODO put classes in separate files and clean up absurd if-ceptions

@Injectable()
export class RouteDispatcherActivateGuard {
  constructor(
    private router: Router,
    private mainDataService: MainDataService,
    private backendService: BackendService
  ) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const authData = this.mainDataService.getAuthData();
    if (!authData) {
      this.router.navigate(['/r/login', '']);
      return false;
    }
    if (authData.flags.indexOf('codeRequired') >= 0) {
      this.router.navigate(['/r/code-input']);
      return false;
    }
    if (
      authData.claims &&
      Object.keys(authData.claims).length === 1 &&
      authData.claims.test &&
      authData.claims.test.length === 1 &&
      this.router.getCurrentNavigation()?.previousNavigation === null
    ) {
      this.backendService.startTest(authData.claims.test[0].id)
        .subscribe(testId => {
          this.router.navigate(['/t', testId]);
        });
    } else {
      this.router.navigate(['/r/starter'], this.router.getCurrentNavigation()?.extras);
      return false;
    }
    return true;
  }
}

@Injectable()
export class DirectLoginActivateGuard {
  constructor(
    private mds: MainDataService,
    private bs: BackendService,
    private router: Router
  ) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    const name = state.url.substr(1);
    if (name.length > 0 && name.indexOf('/') < 0) {
      return this.bs.login('login', name)
        .pipe(
          map((authDataResponse: AuthData) => {
            this.mds.setAuthData(authDataResponse as AuthData);
            if (!authDataResponse.flags.includes('codeRequired')) {
              if (authDataResponse.claims.test && authDataResponse.claims.test.length === 1) {
                this.bs.startTest(authDataResponse.claims.test[0].id)
                  .subscribe(testId => {
                    this.router.navigate(['/t', testId]);
                    return false;
                  });
              }
              if (authDataResponse.claims.sysCheck && authDataResponse.claims.sysCheck.length === 1) {
                this.router.navigate([`/check/${authDataResponse.claims.sysCheck[0].workspaceId}/${authDataResponse.claims.sysCheck[0].id}`]);
                return false;
              }
            }
            this.router.navigate(['/r']);
            return false;
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
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.flags) {
        if (authData.flags.indexOf('codeRequired') >= 0) {
          return true;
        }
        this.router.navigate(['/r']);
        return false;
      }
      this.router.navigate(['/r']);
      return false;
    }
    this.router.navigate(['/r']);
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminComponentActivateGuard {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.claims) {
        if (authData.claims.workspaceAdmin) {
          return true;
        }
        this.router.navigate(['/r']);
        return false;
      }
      this.router.navigate(['/r']);
      return false;
    }
    this.router.navigate(['/r']);
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrSuperAdminComponentActivateGuard {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.claims) {
        if (authData.claims.workspaceAdmin || authData.claims.superAdmin) {
          return true;
        }
        this.router.navigate(['/r']);
        return false;
      }
      this.router.navigate(['/r']);
      return false;
    }
    this.router.navigate(['/r']);
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SuperAdminComponentActivateGuard {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.claims) {
        if (authData.claims.superAdmin) {
          return true;
        }
        this.router.navigate(['/r']);
        return false;
      }
      this.router.navigate(['/r']);
      return false;
    }
    this.router.navigate(['/r']);
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TestComponentActivateGuard {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.claims) {
        if (authData.claims.test) {
          return true;
        }
        this.router.navigate(['/r']);
        return false;
      }
      this.router.navigate(['/r']);
      return false;
    }
    this.router.navigate(['/r']);
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GroupMonitorActivateGuard {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) {}

  canActivate(): boolean {
    const authData = this.mainDataService.getAuthData();

    if (authData && authData.claims && authData.claims.testGroupMonitor) {
      return true;
    }
    this.router.navigate(['/r']);
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class StarterActivateGuard {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) {}

  canActivate(): boolean {
    const authData = this.mainDataService.getAuthData();

    if (authData) {
      return true;
    }
    this.router.navigate(['/r']);
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class StudyMonitorActivateGuard {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) {
  }

  canActivate(): boolean {
    const authData = this.mainDataService.getAuthData();

    if (authData && authData.claims && authData.claims.studyMonitor) {
      return true;
    }

    this.router.navigate(['/r']);
    return false;
  }
}
