import { Injectable } from '@angular/core';
import { UiVisibilityService } from '../shared/services/ui-visibility.service';
import { MainDataService } from '../shared/services/maindata/maindata.service';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  title: string = '';
  showLogo = true;
  showAccountPanel: boolean = false;
  accountName?: string;

  constructor(private mds: MainDataService, private uiVisibilityService: UiVisibilityService) {
    this.accountName = this.mds.getAuthData()?.displayName;
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
