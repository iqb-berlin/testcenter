import { inject } from '@angular/core';
import { CanDeactivateFn, Router } from '@angular/router';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerService } from '../services/test-controller.service';

export const unitDeactivateGuard: CanDeactivateFn<UnithostComponent> = (
  _component, _currentRoute, _currentState, nextState
) => {
  const tcs = inject(TestControllerService);

  // 'popstate' for browser triggers, 'imperative' for angular router triggers - not in official documentation
  // https://angular.love/angular-router-everything-you-need-to-know-about
  const trigger = inject(Router).currentNavigation()?.trigger;
  const preventNav = tcs.booklet?.config.browserBehaviour === 'preventNav';
  const browserTriggered = trigger === 'popstate' || trigger === 'hashchange';

  if (browserTriggered && preventNav) {
    return false;
  }

  return tcs.getUnitDeactivationCheck(nextState.url);
};
