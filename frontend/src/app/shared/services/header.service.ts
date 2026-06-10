import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  title?: string;
  showLogo = true;
  showAccountPanel: boolean = false;
  isHeaderHidden = false;

  reset() {
    this.title = '';
    this.showLogo = true;
    this.showAccountPanel = false;
  }
}
