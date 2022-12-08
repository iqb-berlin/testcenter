// eslint-disable-next-line max-classes-per-file
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MainDataService } from './shared/shared.module';
import { AuthData } from './app.interfaces';
import { BackendService } from './backend.service';

// TODO put classes in separate files and clean up absurd if-ceptions

@Injectable()
export class RouteDispatcherActivateGuard implements CanActivate {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.token) {
        if (authData.access.workspaceAdmin || authData.access.superAdmin) {
          this.router.navigate(['/r/admin-starter']);
        } else if (authData.flags.indexOf('codeRequired') >= 0) {
          this.router.navigate(['/r/code-input']);
        } else if (authData.access.testGroupMonitor) {
          this.router.navigate(['/r/monitor-starter']);
        } else if (authData.access.test) {
          this.router.navigate(['/r/test-starter'], this.router.getCurrentNavigation().extras);
        } else {
          this.router.navigate(['/r/login', '']);
        }
      } else {
        this.router.navigate(['/r/login', '']);
      }
    } else {
      this.router.navigate(['/r/login', '']);
    }

    return false;
  }
}

@Injectable()
export class DirectLoginActivateGuard implements CanActivate {
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
      return this.bs.loginAsLogin({ name })
        .pipe(
          map((authDataResponse: AuthData | number) => {
            if (typeof authDataResponse !== 'number') {
              this.mds.setAuthData(authDataResponse as AuthData);
              this.router.navigate(['/r']);
              return false;
            }
            // if a link to a non-existing or password locked login was given, absolutely nothing happens.
            // TODO should there be an error instead?
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
export class CodeInputComponentActivateGuard implements CanActivate {
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
export class AdminComponentActivateGuard implements CanActivate {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.access) {
        if (authData.access.workspaceAdmin) {
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
export class AdminOrSuperAdminComponentActivateGuard implements CanActivate {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.access) {
        if (authData.access.workspaceAdmin || authData.access.superAdmin) {
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
export class SuperAdminComponentActivateGuard implements CanActivate {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.access) {
        if (authData.access.superAdmin) {
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
export class TestComponentActivateGuard implements CanActivate {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.access) {
        if (authData.access.test) {
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
export class GroupMonitorActivateGuard implements CanActivate {
  constructor(
    private router: Router,
    private mainDataService: MainDataService
  ) {}

  canActivate(): boolean {
    const authData = this.mainDataService.getAuthData();

    if (authData && authData.access && authData.access.testGroupMonitor) {
      return true;
    }
    this.router.navigate(['/r']);
    return false;
  }
}
