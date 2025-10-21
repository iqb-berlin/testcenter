import { Component } from '@angular/core';

@Component({
    template: `<div class="root-body">
           <router-outlet></router-outlet>
         </div>
        `,
    standalone: false
})
export class AppRootComponent {
}
