import {
  Component, OnDestroy, OnInit
} from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { CustomtextService, MainDataService } from './shared/shared.module';
import { BackendService } from './backend.service';
import { AppConfig } from './shared/classes/app.config';

@Component({
  selector: 'tc-root',
  templateUrl: './app.component.html'
})

export class AppComponent implements OnInit, OnDestroy {
  private appErrorSubscription: Subscription | null = null;
  private appTitleSubscription: Subscription | null = null;

  showError = false;

  constructor(
    public mainDataService: MainDataService,
    private backendService: BackendService,
    private customtextService: CustomtextService,
    private titleService: Title,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.appErrorSubscription = this.mainDataService.appError$
        .subscribe(err => {
          if (err.type === 'fatal') {
            this.mainDataService.quit();
          }
          if (!this.disableGlobalErrorDisplay()) {
            this.showError = true;
          }
        });

      this.appTitleSubscription = combineLatest([this.mainDataService.appTitle$, this.mainDataService.appSubTitle$])
        .subscribe(titles => {
          if (titles[1]) {
            this.titleService.setTitle(`${titles[0]} | ${titles[1]}`);
          } else {
            this.titleService.setTitle(titles[0]);
          }
        });

      window.addEventListener('message', (event: MessageEvent) => {
        const msgData = event.data;
        const msgType = msgData.type;
        if ((msgType !== undefined) && (msgType !== null)) {
          if ((msgType.substr(0, 2) === 'vo')) {
            this.mainDataService.postMessage$.next(event);
          }
        }
      });

      this.setupFocusListeners();
      this.setupFullScreenListener();

      this.backendService.getSysConfig()
        .subscribe(sysConfig => {
          this.mainDataService.appConfig$ = new AppConfig(sysConfig, this.customtextService, this.sanitizer);
        });

      // TODO don't ask for Syschecks on start, do it on SysCheck starter. Save calls.
      this.backendService.getSysCheckInfo()
        .subscribe(sysCheckConfigs => {
          this.mainDataService.sysCheckAvailableForAll = !!sysCheckConfigs;
          console.log(this.mainDataService.sysCheckAvailableForAll);
        });
    });
  }

  // some modules have their own error handling
  private disableGlobalErrorDisplay(): boolean {
    const routeData = this.route.firstChild?.routeConfig?.data ?? {};
    // eslint-disable-next-line @typescript-eslint/dot-notation
    return 'disableGlobalErrorDisplay' in routeData;
  }

  private setupFocusListeners(): void {
    if (typeof document.hidden !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.mainDataService.appWindowHasFocus$.next(!document.hidden);
      }, false);
    }
    window.addEventListener('blur', () => {
      this.mainDataService.appWindowHasFocus$.next(document.hasFocus());
    });
    window.addEventListener('focus', () => {
      this.mainDataService.appWindowHasFocus$.next(document.hasFocus());
    });
    window.addEventListener('unload', () => {
      this.mainDataService.appWindowHasFocus$.next(!document.hidden);
    });
  }

  private setupFullScreenListener(): void {
    document.addEventListener(
      'fullscreenchange',
      () => {
        this.mainDataService.isFullScreen = !!document.fullscreenElement;
      },
      false
    );
  }

  closeErrorBox(): void {
    this.showError = false;
  }

  ngOnDestroy(): void {
    if (this.appErrorSubscription !== null) {
      this.appErrorSubscription.unsubscribe();
    }
    if (this.appTitleSubscription !== null) {
      this.appTitleSubscription.unsubscribe();
    }
  }
}
