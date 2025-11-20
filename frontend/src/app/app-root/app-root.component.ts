import { Component } from '@angular/core';

@Component({
    template: `<div>
           <router-outlet></router-outlet>
         </div>
        `,
    standalone: false
})
export class AppRootComponent {
}
