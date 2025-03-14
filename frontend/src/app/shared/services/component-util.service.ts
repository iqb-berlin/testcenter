import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ComponentUtilService {
  constructor(
    private router: Router
  ) { }

  // courtesy of https://javascript.plainenglish.io/angular-how-you-can-reload-refresh-a-single-component-or-the-entire-application-and-reuse-the-logic-c6e975a278c3
  reloadComponent(self:boolean, urlToNavigateTo ?:string) {
    const url = self ? this.router.url : urlToNavigateTo;
    // skipLocationChange:true means don't update the url to / when navigating
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([`/${url}`]).then(() => {
      });
    });
  }
}
