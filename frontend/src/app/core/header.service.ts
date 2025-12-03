import { Injectable } from '@angular/core';
import { UiVisibilityService } from '../shared/services/ui-visibility.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  private ngUnsubscribe = new Subject<void>();

  showLogo = true;
  title: string = '';

  constructor(private uiVisibilityService: UiVisibilityService) { }

  ngOnInit(): void {
    this.uiVisibilityService.showConfirmationUI$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(showUI => {
        this.showLogo = showUI;
      });
  }

  setTitle(newTitle: string): void {
    this.title = newTitle;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
