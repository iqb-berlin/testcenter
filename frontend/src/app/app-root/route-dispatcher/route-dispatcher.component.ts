import { Component } from '@angular/core';
import { Router, RouterState, RouterStateSnapshot } from '@angular/router';

@Component({
  templateUrl: './route-dispatcher.component.html',
  styles: [
    'mat-card {margin: 10px;}',
    '.root-frame {padding: 80px;}'
  ]
})

export class RouteDispatcherComponent {
  url = '';

  constructor(
    private router: Router
  ) {
    const state: RouterState = router.routerState;
    const snapshot: RouterStateSnapshot = state.snapshot;
    this.url = snapshot.url;
  }
}
