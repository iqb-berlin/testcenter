import { Component, Input, OnChanges } from '@angular/core';
import {
  Observable, ReplaySubject, Subject, Subscription
} from 'rxjs';
import { map } from 'rxjs/operators';
import { CustomtextPipe } from '../../pipes/customtext/customtext.pipe';
import { CustomtextService } from '../../services/customtext/customtext.service';
import { AlertLevel } from '../../interfaces/alert.interfaces';

@Component({
    selector: 'tc-alert',
    templateUrl: 'alert.component.html',
    styleUrls: ['alert.component.css'],
    standalone: false
})
export class AlertComponent implements OnChanges {
  @Input() text: string = '';
  @Input() customtext: string = '';
  @Input() replacements: string[] = [];
  @Input() level: AlertLevel = 'info';

  icons: { [level in AlertLevel]: string } = {
    error: 'error',
    warning: 'warning',
    info: 'info',
    success: 'check_circle'
  };

  get displayText$(): Observable<string> {
    return this._displayText$
      .pipe(
        map(text => AlertComponent.highlightTicks(text || ''))
      );
  }

  private _displayText$: Subject<string>;
  private customTextSubscription: Subscription | null = null;

  constructor(
    private cts: CustomtextService
  ) {
    this._displayText$ = new ReplaySubject<string>();
  }

  ngOnChanges(): void {
    this.unsubscribeCustomText();
    if (!this.customtext) {
      this._displayText$.next(this.text);
    } else {
      this.subscribeCustomText();
    }
  }

  private subscribeCustomText(): void {
    this.customTextSubscription = this.getCustomtext()
      .subscribe(text => this._displayText$.next(text));
  }

  private unsubscribeCustomText(): void {
    if (this.customTextSubscription) {
      this.customTextSubscription.unsubscribe();
      this.customTextSubscription = null;
    }
  }

  getCustomtext(): Observable<string> {
    return new CustomtextPipe(this.cts)
      .transform(this.text, this.customtext, ...(this.replacements || []));
  }

  private static highlightTicks = (text: string): string => text.replace(
    /\u0060([^\u0060]+)\u0060/g,
    (match, match2) => `<span class='highlight'>${match2}</span>`
  );
}
