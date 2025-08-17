import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiVisibilityService {
  private showConfirmationUISubject = new BehaviorSubject<boolean>(true);
  
  readonly showConfirmationUI$ = this.showConfirmationUISubject.asObservable();

  setShowConfirmationUI(show: boolean): void {
    this.showConfirmationUISubject.next(show);
  }

}