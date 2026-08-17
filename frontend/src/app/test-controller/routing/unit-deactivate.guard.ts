import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanDeactivate, Router, RouterStateSnapshot
} from '@angular/router';
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
  ) {
    // 'popstate' for browser triggers, 'imperative' for angular router triggers - not in official documentation
    // https://angular.love/angular-router-everything-you-need-to-know-about
    const trigger = this.router.currentNavigation()?.trigger;
    const preventNav = this.tcs.booklet?.config.browserBehaviour === 'preventNav';
    const browserTriggered = trigger === 'popstate' || trigger === 'hashchange';

    if (browserTriggered && preventNav) {
      return false;
    }

    // Routed through TestControllerService (instead of calling canDeactivateUnit directly) so that
    // TestControllerDeactivateGuard - which Angular may check concurrently for this same navigation
    // when this unit route's parent (`:t`) is also being deactivated - can reuse this exact check
    // instead of running its own, separate one and popping a second dialog on top of/after this one.
    return this.tcs.getUnitDeactivationCheck(nextState.url);
  }
}
