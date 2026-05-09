import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanDeactivate, Router, RouterStateSnapshot
} from '@angular/router';
import { Observable, of, tap } from 'rxjs';
// eslint-disable-next-line import/no-cycle
import { Location } from '@angular/common';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerService } from '../services/test-controller.service';
import { TestControllerState } from '@app/test-controller/interfaces/test-controller.interfaces';
import { MessageService } from '@shared/services/message.service';
import { switchMap } from 'rxjs/operators';
import { CustomtextService } from '@shared/services/customtext/customtext.service';

@Injectable()
export class UnitDeactivateGuard implements CanDeactivate<UnithostComponent> {
  constructor(
    private tcs: TestControllerService,
    private messageService: MessageService,
    private cts: CustomtextService,
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

    return this.tcs.state$.pipe(
      switchMap((state: TestControllerState) => {
        // The guard is actually called twice: once for 'route-dispatcher' and once for 'status'.
        // To avoid showing the dialog twice we only intercept the route to status. This prevents
        // routing to the status component completely making routing back to the unit unnecessary.
        if (state !== 'RUNNING' || !nextState.url.includes('status')) {
          return this.tcs.canDeactivateUnit(nextState.url);
        }

        return this.messageService.showConfirmDialog({
          title: 'Sicher, dass du den Test beenden möchtest?',
          content: ''
        }).pipe(
          switchMap(result => {
            if (!result) {
              return of(false);
            }
            this.terminateTest();
            return of(true);
          })
        );
      })
    );
  }

  terminateTest(): void {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE', true,
                           this.tcs.booklet?.config.lock_test_on_termination === 'ON');
    this.cts.restoreDefault(false);
  }
}
