import { Component } from '@angular/core';
import { Router, RouterState, RouterStateSnapshot } from '@angular/router';

@Component({
  template: `
    <div class="flex-row" [style.justify-content]="'center'">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Diese Seite wurde nicht gefunden.</mat-card-title>
        </mat-card-header>
        <mat-card-content>{{url}}</mat-card-content>
        <mat-card-actions>
          <button [routerLink]="['/']" mat-raised-button>Zur Startseite</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    '.mat-mdc-card {width: 400px; margin-top: 80px;}'
  ],
  standalone: false
})
export class PageNotFoundComponent {
  url = '';

  constructor(
    private router: Router
  ) {
    const state: RouterState = router.routerState;
    const snapshot: RouterStateSnapshot = state.snapshot;
    this.url = snapshot.url;
  }
}
