import {
  Component, OnDestroy, OnInit
} from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { CustomtextService, MainDataService } from './shared/shared.module';
import { BackendService } from './backend.service';
import { AppError } from './app.interfaces';
import { AppConfig } from './shared/classes/app.config';

@Component({
  selector: 'tc-root',
  templateUrl: './app.component.html'
})

export class AppComponent implements OnInit, OnDestroy {
  private appErrorSubscription: Subscription = null;
  private appTitleSubscription: Subscription = null;

  showError = false;
  errorData: AppError;

  constructor(
    public mds: MainDataService,
    private bs: BackendService,
    private cts: CustomtextService,
    private titleService: Title,
    private sanitizer: DomSanitizer
  ) { }

  closeErrorBox(): void {
    this.showError = false;
    this.mds.appError$.next();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.appErrorSubscription = this.mds.appError$.subscribe(err => {
        if (err) {
          this.errorData = err;
          this.showError = true;
        }
      });
      this.appTitleSubscription = combineLatest([this.mds.appTitle$, this.mds.appSubTitle$, this.mds.isSpinnerOn$])
        .subscribe(titles => {
          if (titles[2]) {
            this.titleService.setTitle(`${titles[0]} | Bitte warten}`);
          } else if (titles[1]) {
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
            this.mds.postMessage$.next(event);
          }
        }
      });

      this.setupFocusListeners();

      this.bs.getSysConfig().subscribe(sysConfig => {
        if (!sysConfig) {
          this.mds.appError$.next({
            label: 'Server-Problem: Konnte Konfiguration nicht laden',
            description: 'getSysConfig ist fehlgeschlagen',
            category: 'FATAL'
          });
          return;
        }
        this.mds.appConfig = new AppConfig(sysConfig, this.cts, this.mds.expectedApiVersion, this.sanitizer);
        this.mds.appTitle$.next(this.mds.appConfig.appTitle);
        this.mds.appConfig.applyBackgroundColors();
        this.mds.globalWarning = this.mds.appConfig.warningMessage;

        const authData = MainDataService.getAuthData();
        if (authData) {
          this.cts.addCustomTexts(authData.customTexts);
        }

        if (!this.mds.appConfig.isValidApiVersion) {
          this.mds.appError$.next({
            label: 'Server-Problem: API-Version ungültig',
            description:
              `erwartet: ${this.mds.expectedApiVersion}, gefunden: ${this.mds.appConfig.detectedApiVersion}`,
            category: 'FATAL'
          });
        }
      });

      this.bs.getSysCheckInfo().subscribe(sysCheckConfigs => {
        this.mds.sysCheckAvailable = !!sysCheckConfigs;
      });
    });
  }

  private setupFocusListeners() {
    let hidden = '';
    let visibilityChange = '';
    if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
      hidden = 'hidden';
      visibilityChange = 'visibilitychange';
      // eslint-disable-next-line @typescript-eslint/dot-notation
    } else if (typeof document['msHidden'] !== 'undefined') {
      hidden = 'msHidden';
      visibilityChange = 'msvisibilitychange';
      // eslint-disable-next-line @typescript-eslint/dot-notation
    } else if (typeof document['mozHidden'] !== 'undefined') {
      hidden = 'mozHidden';
      visibilityChange = 'mozHidden';
      // eslint-disable-next-line @typescript-eslint/dot-notation
    } else if (typeof document['webkitHidden'] !== 'undefined') {
      hidden = 'webkitHidden';
      visibilityChange = 'webkitvisibilitychange';
    }
    if (hidden && visibilityChange) {
      document.addEventListener(visibilityChange, () => {
        this.mds.appWindowHasFocus$.next(!document[hidden]);
      }, false);
    }
    window.addEventListener('blur', () => {
      this.mds.appWindowHasFocus$.next(document.hasFocus());
    });
    window.addEventListener('focus', () => {
      this.mds.appWindowHasFocus$.next(document.hasFocus());
    });
    window.addEventListener('unload', () => {
      this.mds.appWindowHasFocus$.next(!document[hidden]);
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
