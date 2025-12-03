import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
/* This service allows to hide UI elements like prompts and everything that may interfere with the test.
   "ConfirmationUI" means all elements that may pop up. */
export class UiVisibilityService {
  private showConfirmationUISubject = new BehaviorSubject<boolean>(true);

  readonly showConfirmationUI$ = this.showConfirmationUISubject.asObservable();

  setShowConfirmationUI(show: boolean): void {
    this.showConfirmationUISubject.next(show);
  }
}