import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VeronaAPIService {
  postMessageTarget: Window = window;

  sendPageNav(sessionID: string | undefined, target: string): void {
    this.postMessageTarget.postMessage({
      type: 'vopPageNavigationCommand',
      sessionId: sessionID,
      target: target
    }, '*');
  }
}
