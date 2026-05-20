import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanDeactivate, Router, RouterStateSnapshot
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerService } from '../services/test-controller.service';

@Injectable()
export class UnitDeactivateGuard implements CanDeactivate<UnithostComponent> {
  constructor(
    private tcs: TestControllerService,
    private router: Router
  ) {}

  canDeactivate(
    _component: UnithostComponent,
    _currentRoute: ActivatedRouteSnapshot,
    _currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): Observable<boolean> {
    // 'popstate' for browser triggers, 'imperative' for angular router triggers - not in official documentation
    // https://angular.love/angular-router-everything-you-need-to-know-about
    const trigger = this.router.currentNavigation()?.trigger;
    const preventNav = this.tcs.booklet?.config.browserBehaviour === 'preventNav';
    const browserTriggered = trigger === 'popstate' || trigger === 'hashchange';

    if (browserTriggered && preventNav) {
      return of(false);
    }

    return this.tcs.canDeactivateUnit(nextState.url);
  }
}
