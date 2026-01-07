import { Component } from '@angular/core';

@Component({
  template: `
           <router-outlet></router-outlet>
        `,
  styles: `
      :host {
        flex: 1;
        display: flex;
        flex-direction: column;
      }`,
  standalone: false
})
export class AppRootComponent {
}
