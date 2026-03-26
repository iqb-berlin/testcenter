import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanDeactivate, Router, RouterStateSnapshot
} from '@angular/router';
import { Observable, of, tap } from 'rxjs';
// eslint-disable-next-line import/no-cycle
import { Location } from '@angular/common';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerService } from '../services/test-controller.service';

@Injectable()
export class UnitDeactivateGuard implements CanDeactivate<UnithostComponent> {
  constructor(
    private tcs: TestControllerService,
    private router: Router,
    private location: Location
  ) {}

  canDeactivate(
    component: UnithostComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): Observable<boolean> {
    // 'popstate' for browser triggers, 'imperative' for angular router triggers - not in official documentation
    // https://angular.love/angular-router-everything-you-need-to-know-about
    const trigger = this.router.currentNavigation()?.trigger;
    const preventNav = this.tcs.booklet?.config.browserBehaviour === 'preventNav';
    // 'popstate' are all browser-based navigation; not including 'imperative' means that regular Angular-handled
    // navigationRequests don't lead to a new entry on the history stack, hence no pollution
    if (trigger === 'popstate' && preventNav) {
      this.location.go(currentState.url);
      return of(false);
    }

    return this.tcs.canDeactivateUnit(nextState.url);
  }
}
