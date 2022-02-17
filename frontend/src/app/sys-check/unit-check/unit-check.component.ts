import {
  Component, OnInit, HostListener, OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MainDataService } from '../../shared/shared.module';
import { BackendService } from '../backend.service';
import { SysCheckDataService } from '../sys-check-data.service';

declare let srcDoc: any;

@Component({
  selector: 'iqb-unit-check',
  templateUrl: './unit-check.component.html',
  styleUrls: ['./unit-check.component.css']
})
export class UnitCheckComponent implements OnInit, OnDestroy {
  pageList: PageData[] = [];
  currentPage: number;
  private iFrameHostElement: HTMLElement;
  private iFrameItemplayer: HTMLIFrameElement = null;
  private postMessageSubscription: Subscription = null;
  private taskSubscription: Subscription = null;
  private postMessageTarget: Window = null;
  private itemplayerSessionId = '';
  private pendingUnitDef = '';

  constructor(
    private ds: SysCheckDataService,
    private bs: BackendService,
    private mds: MainDataService
  ) {
  }

  @HostListener('window:resize')
  onResize(): any {
    if (this.iFrameItemplayer && this.iFrameHostElement) {
      const divHeight = this.iFrameHostElement.clientHeight;
      this.iFrameItemplayer.setAttribute('height', String(divHeight - 5));
      // TODO: Why minus 5px?
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.ds.setNewCurrentStep('u');
      if (this.ds.unitAndPlayerContainer) {
        this.iFrameHostElement = <HTMLElement>document.querySelector('#iFrameHost');
        this.postMessageSubscription = this.mds.postMessage$.subscribe((m: MessageEvent) => {
          const msgData = m.data;
          const msgType = msgData.type;

          if ((msgType !== undefined) && (msgType !== null)) {
            switch (msgType) {
              case 'vopReadyNotification':
                this.iFrameItemplayer.setAttribute('height', String(Math.trunc(this.iFrameHostElement.clientHeight)));
                this.postMessageTarget = m.source as Window;
                this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();
                this.postMessageTarget.postMessage({
                  type: 'vopStartCommand',
                  sessionId: this.itemplayerSessionId,
                  unitDefinition: this.pendingUnitDef,
                  playerConfig: {
                    logPolicy: 'disabled',
                    stateReportPolicy: 'eager'
                  }
                }, '*');

              // eslint-disable-next-line no-fallthrough
              case 'vopStateChangedNotification':
                if (msgData.playerState) {
                  const { playerState } = msgData;
                  this.setPageList(Object.keys(playerState.validPages), playerState.currentPage);
                  this.currentPage = playerState.currentPage;
                }
                break;

              default:
                console.log(`processMessagePost ignored message: ${msgType}`);
                break;
            }
          }
        });

        while (this.iFrameHostElement.hasChildNodes()) {
          this.iFrameHostElement.removeChild(this.iFrameHostElement.lastChild);
        }
        this.pendingUnitDef = this.ds.unitAndPlayerContainer.def;
        this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
        this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
        this.iFrameItemplayer.setAttribute('class', 'unitHost');
        this.iFrameItemplayer.setAttribute('height', String(this.iFrameHostElement.clientHeight - 5));
        this.iFrameHostElement.appendChild(this.iFrameItemplayer);
        srcDoc.set(this.iFrameItemplayer, this.ds.unitAndPlayerContainer.player);
      }
    });
  }

  setPageList(validPages: string[], currentPage: string) {
    if ((validPages instanceof Array)) {
      const newPageList: PageData[] = [];
      if (validPages.length > 1) {
        for (let i = 0; i < validPages.length; i++) {
          if (i === 0) {
            newPageList.push({
              index: -1,
              id: '#previous',
              disabled: validPages[i] === currentPage,
              type: '#previous'
            });
          }

          newPageList.push({
            index: i + 1,
            id: validPages[i],
            disabled: validPages[i] === currentPage,
            type: '#goto'
          });

          if (i === validPages.length - 1) {
            newPageList.push({
              index: -1,
              id: '#next',
              disabled: validPages[i] === currentPage,
              type: '#next'
            });
          }
        }
      }
      this.pageList = newPageList;
    } else if ((this.pageList.length > 1) && (currentPage !== undefined)) {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if (this.pageList[i].type === '#goto') {
          if (this.pageList[i].id === currentPage) {
            this.pageList[i].disabled = true;
            currentPageIndex = i;
          } else {
            this.pageList[i].disabled = false;
          }
        }
      }
      if (currentPageIndex === 1) {
        this.pageList[0].disabled = true;
        this.pageList[this.pageList.length - 1].disabled = false;
      } else {
        this.pageList[0].disabled = false;
        this.pageList[this.pageList.length - 1].disabled = currentPageIndex === this.pageList.length - 2;
      }
    }
  }

  gotoPage(action: string, index = 0): void {
    let nextPageId = '';
    // currentpage is detected by disabled-attribute of page
    if (action === '#next') {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if ((this.pageList[i].index > 0) && (this.pageList[i].disabled)) {
          currentPageIndex = i;
          break;
        }
      }
      if ((currentPageIndex > 0) && (currentPageIndex < this.pageList.length - 2)) {
        nextPageId = this.pageList[currentPageIndex + 1].id;
      }
    } else if (action === '#previous') {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if ((this.pageList[i].index > 0) && (this.pageList[i].disabled)) {
          currentPageIndex = i;
          break;
        }
      }
      if (currentPageIndex > 1) {
        nextPageId = this.pageList[currentPageIndex - 1].id;
      }
    } else if (action === '#goto') {
      if ((index > 0) && (index < this.pageList.length - 1)) {
        nextPageId = this.pageList[index].id;
      }
    } else if (index === 0) {
      // call from player
      nextPageId = action;
    }

    if (nextPageId.length > 0) {
      if (typeof this.postMessageTarget !== 'undefined') {
        this.postMessageTarget.postMessage({
          type: 'vopPageNavigationCommand',
          sessionId: this.itemplayerSessionId,
          target: nextPageId
        }, '*');
      }
    }
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

export interface PageData {
  index: number;
  id: string;
  type: '#next' | '#previous' | '#goto';
  disabled: boolean;
}
