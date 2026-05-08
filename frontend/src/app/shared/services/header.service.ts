import { Injectable } from '@angular/core';
import { UiVisibilityService } from './ui-visibility.service';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  title?: string;
  showLogo = true;
  showAccountPanel: boolean = false;

  constructor(private uiVisibilityService: UiVisibilityService) {
    this.uiVisibilityService.showConfirmationUI$
      // no unsubscribe necessary because the service basically lives forever
      .subscribe(showUI => {
        this.showLogo = showUI;
      });
  }

  reset() {
    this.title = '';
    this.showLogo = true;
    this.showAccountPanel = false;
  }
}
