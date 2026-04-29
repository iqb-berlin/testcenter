import { Component } from '@angular/core';

@Component({
  template: `
           <router-outlet></router-outlet>
        `,
  styles: `
      :host {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: auto;
      }`,
  standalone: false
})
export class AppRootComponent {
}
