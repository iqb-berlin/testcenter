import {
  Component, Input, OnDestroy, OnInit
} from '@angular/core';
import { Router, RouterState } from '@angular/router';
import {
  interval, Observable, Subscription, take
} from 'rxjs';
import UAParser from 'ua-parser-js';
import { AppError } from '../../../app.interfaces';
import { MainDataService } from '../../services/maindata/maindata.service';

@Component({
  selector: 'error',
  templateUrl: 'error.component.html',
  styleUrls: ['error.component.css']
})
export class ErrorComponent implements OnInit, OnDestroy {
  @Input() onBeforeClose: () => void;
  @Input() onClose: () => void;
  @Input() closeCaption: string;
  @Input() additionalReport: { [key: string]: string };
  error: AppError;
  errorBuffer: AppError[] = [];
  errorDetailsOpen = false;
  allowErrorDetails = true;
  defaultCloseCaption: string;
  browser: UAParser.IResult;
  url: string;
  private appErrorSubscription: Subscription;
  private restartTimerSubscription: Subscription;
  restartTimer$: Observable<number>;
  waitUnitAutomaticRestartSeconds: number = 120;
  uncloseable = false;

  constructor(
    private mainDataService: MainDataService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.browser = new UAParser().getResult();
    this.appErrorSubscription = this.mainDataService.appError$
      .subscribe(err => {
        if (err.type === 'fatal') {
          this.uncloseable = true;
        }

        if (err.type === 'network_temporally') {
          this.uncloseable = true;
          this.startRestartTimer();
        }

        if (err.type === 'session') {
          this.allowErrorDetails = false;
        }

        if (err.type === 'warning') {
          this.allowErrorDetails = false;
        }

        if (this.error) {
          this.errorBuffer.push(this.error);
        }
        this.error = err;

        this.url = window.location.href;

        this.setDefaultCloseCaption();
      });
  }

  private setDefaultCloseCaption(): void {
    if (this.error.type === 'session') {
      this.defaultCloseCaption = 'Neu Anmelden';
      return;
    }
    this.defaultCloseCaption = undefined;
  }

  private startRestartTimer(): void {
    if (this.restartTimer$) {
      return;
    }
    this.restartTimer$ = interval(1000)
      .pipe(take(this.waitUnitAutomaticRestartSeconds));
    this.restartTimerSubscription = this.restartTimer$
      .subscribe({
        complete: () => {
          this.mainDataService.reloadPage();
        }
      });
  }

  ngOnDestroy(): void {
    this.appErrorSubscription.unsubscribe();
    if (this.restartTimerSubscription) {
      this.restartTimerSubscription.unsubscribe();
    }
  }

  toggleErrorDetails(): void {
    this.errorDetailsOpen = !this.errorDetailsOpen;
  }

  closeClick() {
    if (this.onBeforeClose) {
      this.onBeforeClose();
    }
    if (this.onClose) {
      this.onClose();
    } else {
      this.defaultOnClose();
    }
  }

  private defaultOnClose(): void {
    if (this.error.type === 'session') {
      this.mainDataService.resetAuthData();
      const state: RouterState = this.router.routerState;
      const { snapshot } = state;
      const snapshotUrl = (snapshot.url === '/r/login/') ? '' : snapshot.url;
      this.router.navigate(['/r/login', snapshotUrl]);
    }
  }
}
