import {
  Component, ElementRef, Input, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { Router, RouterState } from '@angular/router';
import {
  interval, Observable, Subscription, take
} from 'rxjs';
import UAParser from 'ua-parser-js';
import { AppError } from '../../../app.interfaces';
import { MainDataService } from '../../services/maindata/maindata.service';
import { BugReportService } from '../../services/bug-report.service';
import { BugReportResult } from '../../interfaces/bug-report.interfaces';
import { FileService } from '../../services/file.service';

@Component({
    selector: 'error',
    templateUrl: 'error.component.html',
    styleUrls: ['error.component.css'],
    standalone: false
})
export class ErrorComponent implements OnInit, OnDestroy {
  @Input() onBeforeClose: (() => void) | null = null;
  @Input() onClose: ((err: AppError) => void) | null = null;
  @Input() closeCaption: string = '';
  @Input() additionalReport: { [key: string]: string } = {};
  @ViewChild('report') reportElem!: ElementRef;
  error: AppError | null = null;
  errorBuffer: AppError[] = [];
  errorDetailsOpen = false;
  allowErrorDetails = true;
  defaultCloseCaption: string | null = null;
  browser: UAParser.IResult | null = null;
  url: string = '';
  restartTimer$: Observable<number> | null = null;
  waitUnitAutomaticRestartSeconds: number = 30;
  sendingResult: BugReportResult = { message: '', success: false };
  timestamp: number = -1;
  private appErrorSubscription: Subscription | null = null;
  private restartTimerSubscription: Subscription | null = null;

  constructor(
    private mainDataService: MainDataService,
    private router: Router,
    private bugReportService: BugReportService
  ) {
  }

  ngOnInit(): void {
    this.browser = new UAParser().getResult();
    this.appErrorSubscription = this.mainDataService.appError$
      .subscribe(err => {
        if (err.type === 'network_temporally') {
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
        this.timestamp = Date.now();

        this.setDefaultCloseCaption();
      });
  }

  private setDefaultCloseCaption(): void {
    if (this.error?.type === 'session') {
      this.defaultCloseCaption = 'Neu Anmelden';
      return;
    }
    this.defaultCloseCaption = null;
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
    this.appErrorSubscription?.unsubscribe();
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
    if (!this.error) {
      return;
    }
    if (this.onClose) {
      this.onClose(this.error);
    } else {
      this.defaultOnClose();
    }
  }

  private defaultOnClose(): void {
    if (this.error?.type === 'session') {
      this.mainDataService.resetAuthData();
      const state: RouterState = this.router.routerState;
      const { snapshot } = state;
      const snapshotUrl = (snapshot.url === '/r/login/') ? '' : snapshot.url;
      this.router.navigate(['/r/login', snapshotUrl]);
    }
    if (this.error?.type === 'fatal') {
      this.mainDataService.reloadPage();
    }
    if (this.error?.type === 'network_temporally') {
      this.mainDataService.reloadPage();
    }
    if (this.error?.type === 'session') {
      this.mainDataService.reloadPage(true);
    }
  }

  submitReport(): void {
    this.bugReportService.publishReportAtGithub(
      `[${window.location.hostname}] ${this.error?.label}`,
      this.reportElem.nativeElement.innerText,
      this.error?.type ?? ''
    )
      .subscribe(result => { this.sendingResult = result; });
  }

  downloadReport(): void {
    FileService.saveBlobToFile(
      new Blob([this.reportElem.nativeElement.innerText], { type: 'text/plain' }),
      'bug-report.txt'
    );
  }
}
