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

  closeErrorBox(): void {
    this.showError = false;
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.appErrorSubscription = this.mainDataService.appError$.subscribe(err => {
        console.log('appError$: ', err);
        const routeData = this.route.firstChild?.routeConfig?.data ?? {};
        // eslint-disable-next-line @typescript-eslint/dot-notation
        const disableGlobalErrorDisplay = 'disableGlobalErrorDisplay' in routeData; // some modules have their own error handling
        if (err && !disableGlobalErrorDisplay) {
          this.showError = true;
          this.mainDataService.spinnerOn = false;
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

      this.backendService.getSysConfig().subscribe(sysConfig => {
        if (!sysConfig) {
          // this.mainDataService.({
          //   label: 'Server-Problem: Konnte Konfiguration nicht laden',
          //   description: 'getSysConfig ist fehlgeschlagen',
          //   type: 'general'
          // });
          return;
        }
        this.mainDataService.appConfig = new AppConfig(sysConfig, this.customtextService, this.sanitizer);
        this.mainDataService.appTitle$.next(this.mainDataService.appConfig.appTitle);
        this.mainDataService.appConfig.applyBackgroundColors();
        this.mainDataService.globalWarning = this.mainDataService.appConfig.warningMessage;

        const authData = this.mainDataService.getAuthData();
        if (authData) {
          this.customtextService.addCustomTexts(authData.customTexts);
        }
      });

      this.backendService.getSysCheckInfo().subscribe(sysCheckConfigs => {
        this.mainDataService.sysCheckAvailable = !!sysCheckConfigs;
      });
    });
  }

  private setupFocusListeners() {
    // let hidden = '';
    // let visibilityChange = '';
    if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
      document.addEventListener('visibilitychange', () => {
        this.mainDataService.appWindowHasFocus$.next(!document.hidden);
      }, false);
      // hidden = 'hidden';
      // visibilityChange = 'visibilitychange';
      // TODO can this be removed? seems like compat stuff for old browsers. commented out for now
    // } else if (typeof document['msHidden'] !== 'undefined') {
    //   hidden = 'msHidden';
    //   visibilityChange = 'msvisibilitychange';
    //   // eslint-disable-next-line @typescript-eslint/dot-notation
    // } else if (typeof document['mozHidden'] !== 'undefined') {
    //   hidden = 'mozHidden';
    //   visibilityChange = 'mozHidden';
    //   // eslint-disable-next-line @typescript-eslint/dot-notation
    // } else if (typeof document['webkitHidden'] !== 'undefined') {
    //   hidden = 'webkitHidden';
    //   visibilityChange = 'webkitvisibilitychange';
    }
    // if (hidden && visibilityChange) {
    //   document.addEventListener(visibilityChange, () => {
    //     this.mainDataService.appWindowHasFocus$.next(!document[hidden]);
    //   }, false);
    // }
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

  ngOnDestroy(): void {
    if (this.appErrorSubscription !== null) {
      this.appErrorSubscription.unsubscribe();
    }
    if (this.appTitleSubscription !== null) {
      this.appTitleSubscription.unsubscribe();
    }
  }
}
