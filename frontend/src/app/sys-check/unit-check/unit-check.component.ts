import {
  Component, OnInit, HostListener, OnDestroy, ViewChild, ElementRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MainDataService } from '../../shared/shared.module';
import { SysCheckDataService } from '../sys-check-data.service';
import { Verona5ValidPages, Verona6ValidPages } from '../../test-controller/interfaces/verona.interfaces';

// TODO merge this with the test-controller/unithost component. both could inherit from a parent class

@Component({
  selector: 'tc-unit-check',
  templateUrl: './unit-check.component.html',
  styleUrls: ['./unit-check.component.css']
})
export class UnitCheckComponent implements OnInit, OnDestroy {
  pages: { [id: string]: string } = {};
  pageLabels: string[] = [];
  currentPageIndex: number = -1;

  errorText = '';
  @ViewChild('iFrameHost') private iFrameHostElement!: ElementRef;
  private iFrameItemplayer: HTMLIFrameElement | null = null;
  private postMessageSubscription: Subscription | null = null;
  private taskSubscription: Subscription | null = null;
  private postMessageTarget: Window | null = null;
  private itemplayerSessionId = '';
  private pendingUnitDef = '';

  constructor(
    private ds: SysCheckDataService,
    private mds: MainDataService
  ) {
  }

  @HostListener('window:resize')
  onResize() {
    if (this.iFrameItemplayer) {
      const divHeight = this.iFrameHostElement.nativeElement.clientHeight;
      this.iFrameItemplayer.setAttribute('height', String(divHeight - 5));
      // TODO: Why minus 5px?
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.ds.setNewCurrentStep('u');
      if (this.ds.unitAndPlayerContainer) {
        this.postMessageSubscription = this.mds.postMessage$.subscribe((m: MessageEvent) => {
          const msgData = m.data;
          const msgType = msgData.type;

          if ((msgType !== undefined) && (msgType !== null)) {
            switch (msgType) {
              case 'vopReadyNotification':
                this.iFrameItemplayer?.setAttribute(
                  'height',
                  String(Math.trunc(this.iFrameHostElement.nativeElement.clientHeight))
                );
                this.postMessageTarget = m.source as Window;
                this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();
                this.postMessageTarget.postMessage({
                  type: 'vopStartCommand',
                  sessionId: this.itemplayerSessionId,
                  unitDefinition: this.pendingUnitDef,
                  playerConfig: {
                    logPolicy: 'disabled'
                  }
                }, '*');

              // eslint-disable-next-line no-fallthrough
              case 'vopStateChangedNotification':
                if (msgData.playerState) {
                  const { playerState } = msgData;
                  this.readPages(playerState.validPages);
                  this.currentPageIndex = Object.keys(this.pages).indexOf(playerState.currentPage);
                }
                break;

              default:
                // eslint-disable-next-line no-console
                console.log(`processMessagePost ignored message: ${msgType}`);
                break;
            }
          }
        });

        while (this.iFrameHostElement.nativeElement.hasChildNodes()) {
          this.iFrameHostElement.nativeElement.removeChild(this.iFrameHostElement.nativeElement.lastChild);
        }
        this.pendingUnitDef = this.ds.unitAndPlayerContainer.def;

        this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
        if (!('srcdoc' in this.iFrameItemplayer)) {
          this.errorText =
            'Test-Aufgabe konnte nicht angezeigt werden: Dieser Browser unterstützt das srcdoc-Attribut noch nicht.';
          this.ds.questionnaireReport.push({
            id: 'srcdoc', label: 'srcDoc-Attribut', type: 'error', value: this.errorText, warning: false
          });
          return;
        }

        this.iFrameItemplayer.setAttribute('class', 'unitHost');
        this.iFrameHostElement.nativeElement.appendChild(this.iFrameItemplayer);
        this.iFrameItemplayer.setAttribute('srcdoc', this.ds.unitAndPlayerContainer.player);
      }
    });
  }

  private readPages(validPages: Verona5ValidPages | Verona6ValidPages): void {
    this.pages = { };
    if (!Array.isArray(validPages)) {
      // Verona 2-5
      this.pages = validPages;
    } else {
      // Verona > 6
      // covers also some versions of aspect who send a corrupted format
      validPages
        .forEach((page, index) => {
          this.pages[String(page.id ?? index)] = page.label ?? String(index + 1);
        });
    }
    this.pageLabels = Object.values(this.pages);
  }

  gotoNextPage(): void {
    this.gotoPage(this.currentPageIndex + 1);
  }

  gotoPreviousPage(): void {
    this.gotoPage(this.currentPageIndex - 1);
  }

  gotoPage(targetPageIndex: number): void {
    this.postMessageTarget?.postMessage({
      type: 'vopPageNavigationCommand',
      sessionId: this.itemplayerSessionId,
      target: Object.keys(this.pages)[targetPageIndex]
    }, '*');
  }

  ngOnDestroy(): void {
    if (this.taskSubscription !== null) {
      this.taskSubscription.unsubscribe();
    }
    if (this.postMessageSubscription !== null) {
      this.postMessageSubscription.unsubscribe();
    }
  }
}
