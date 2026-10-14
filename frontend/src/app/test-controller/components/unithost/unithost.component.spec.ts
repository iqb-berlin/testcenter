import {
  ComponentFixture, fakeAsync, TestBed, tick, waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Component, inject, signal } from '@angular/core';
import { WidgetService } from '../../services/widget.service';
import { WidgetDialogComponent, WidgetDialogStatus } from '../widget-dialog/widget-dialog.component';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AssetService } from '@shared/services/asset.service';
import { UnithostComponent } from './unithost.component';
import { TestControllerService } from '../../services/test-controller.service';
import { BackendService } from '../../services/backend.service';
import { MainDataService, BookletConfig } from '../../../shared/shared.module';
import { VeronaNavigationDeniedReason } from '../../interfaces/verona.interfaces';
import { NavigationState } from '../../interfaces/test-controller.interfaces';
import { getTestData } from '../../test/test-data';
import { MessageService } from '../../../shared/services/message.service';

const bookletConfig = new BookletConfig();
bookletConfig.setFromKeyValuePairs({
  loading_mode: 'LAZY',
  logPolicy: 'rich',
  pagingMode: 'separate',
  page_navibuttons: 'FULL',
  unit_navibuttons: 'LABEL',
  unit_menu: 'OFF',
  force_presentation_complete: 'OFF',
  force_responses_complete: 'OFF',
  unit_screenheader: 'EMPTY',
  unit_title: 'ON',
  unit_show_time_left: 'OFF'
});

const MockTestControllerService = {
  bookletConfig,
  workspaceId: 1,
  currentUnitSequenceId: 1,
  currentUnitSequenceId$: new BehaviorSubject(1),
  state$: new BehaviorSubject('RUNNING'),
  currentUnit: getTestData().Units.u1,
  unitAliasMap: { u1: 1 },
  unitContentReady$: of(false),
  navigationDenial$: new Subject<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }>(),
  navigation$: new Subject<NavigationState>(),
  configChanged$: new Subject<void>(),
  getWidgetResourcePath: jasmine.createSpy('getWidgetResourcePath')
};
const MockMainDataService = {
  postMessage$: new Subject(),
  authData$: new Subject(),
  appConfig: { fileServiceUri: '' },
  getAuthData: () => ({ groupToken: 'test-group', viewSettings: {} })
};
const MockActivatedRoute = {
  params: new Subject<Params>(),
  queryParamMap: new Subject()
};
const MockAssetService = {
  getAssetSrc: () => ''
};

@Component({
  template: '',
  providers: [WidgetService]
})
class WidgetServiceOwnerComponent {
  readonly widgets = inject(WidgetService);
}

describe('UnithostComponent', () => {
  let component: UnithostComponent;
  let fixture: ComponentFixture<UnithostComponent>;
  let http: HttpTestingController;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        UnithostComponent,
        CommonModule,
        MatSnackBarModule,
        MatDividerModule,
        MatDialogModule
      ],
      providers: [
        provideNoopAnimations(),
        { provide: TestControllerService, useValue: MockTestControllerService },
        BackendService,
        WidgetService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AssetService, useValue: MockAssetService },
        { provide: MainDataService, useValue: MockMainDataService },
        { provide: ActivatedRoute, useValue: MockActivatedRoute },
        { provide: 'FILE_SERVER_URL', useValue: '/files/' },
        { provide: 'BACKEND_URL', useValue: '/api/' },
        { provide: MessageService, useValue: {} }
      ]
    })
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    MockTestControllerService.currentUnitSequenceId$.next(1);
    MockTestControllerService.state$.next('RUNNING');
    MockTestControllerService.getWidgetResourcePath.calls.reset();
    MockTestControllerService.getWidgetResourcePath.and.returnValue(undefined);
    MockMainDataService.appConfig.fileServiceUri = '';
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UnithostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
  }));

  afterEach(() => {
    fixture.destroy();
    http.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should log the resolved widget file and original call', () => {
    const log = spyOn(console, 'log');
    const warn = spyOn(console, 'warn');
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    const call = { type: 'vopWidgetCall', sessionId: 'u1', callId: 'button-1', widgetType: 'PERIODIC_TABLE' };

    MockMainDataService.postMessage$.next(new MessageEvent('message', { data: call, source: window }));

    expect(MockTestControllerService.getWidgetResourcePath).toHaveBeenCalledOnceWith('PERIODIC_TABLE');
    expect(log).toHaveBeenCalledOnceWith('vopWidgetCall resolved:', 'Resource/periodic.html', call);
    fixture.detectChanges();
    expect(warn).not.toHaveBeenCalled();

    fixture.detectChanges();
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');
    expect(request.request.responseType).toBe('text');
    request.event({ type: HttpEventType.DownloadProgress, loaded: 5, total: 20 });
    expect(log).toHaveBeenCalledTimes(1);
    const html = '<html>widget</html>';
    request.flush(html);
    expect(log).toHaveBeenCalledWith('Widget HTML downloaded:', {
      resourcePath: 'Resource/periodic.html', htmlLength: html.length
    });
  });

  it('should log a missing widget without starting a download', () => {
    const log = spyOn(console, 'log');
    const warn = spyOn(console, 'warn');
    const call = { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'UNKNOWN' };

    MockMainDataService.postMessage$.next(new MessageEvent('message', { data: call, source: window }));

    expect(log).toHaveBeenCalledOnceWith('No uploaded widget found for vopWidgetCall:', call);
    expect(warn).not.toHaveBeenCalled();
  });

  it('should report a widget download failure without logging success', () => {
    const log = spyOn(console, 'log');
    const error = spyOn(console, 'error');
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/missing.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: window
    }));

    fixture.detectChanges();
    http.expectOne('/api/file/test-group/ws_1/Resource/missing.html').flush('Not found', {
      status: 404, statusText: 'Not Found'
    });
    expect(error).toHaveBeenCalledOnceWith('Widget HTML download failed:', 'Resource/missing.html', jasmine.anything());
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('should download through the file server when configured', () => {
    const log = spyOn(console, 'log');
    MockMainDataService.appConfig.fileServiceUri = 'configured';
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: window
    }));

    fixture.detectChanges();
    http.expectOne('/files/file/test-group/ws_1/Resource/periodic.html').flush('<html>widget</html>');
    expect(log).toHaveBeenCalledWith('Widget HTML downloaded:', {
      resourcePath: 'Resource/periodic.html', htmlLength: '<html>widget</html>'.length
    });
  });

  it('should report an empty HTML response as a download failure', () => {
    const log = spyOn(console, 'log');
    const error = spyOn(console, 'error');
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/empty.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: window
    }));

    fixture.detectChanges();
    http.expectOne('/api/file/test-group/ws_1/Resource/empty.html').flush('');
    expect(error).toHaveBeenCalledOnceWith('Widget HTML download failed:', 'Resource/empty.html', jasmine.any(Error));
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending downloads when the unit host is destroyed', () => {
    const log = spyOn(console, 'log');
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: window
    }));
    fixture.detectChanges();
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');

    fixture.destroy();
    expect(request.cancelled).toBeTrue();
    expect(log).toHaveBeenCalledTimes(1);
  });
  function openWidget(source: Window = window): void {
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source
    }));
    fixture.detectChanges();
  }

  it('shows a named loading modal, traps focus, and blocks Escape and backdrop dismissal', fakeAsync(() => {
    openWidget();
    tick();
    const dialog = TestBed.inject(MatDialog);
    const container = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(container?.getAttribute('aria-label')).toBe('Widget PERIODIC_TABLE');
    expect(container?.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(container);
    expect(container?.textContent).toContain('Widget wird geladen');
    expect(document.querySelector('.cdk-overlay-pane')?.getAttribute('style')).toContain('width: 95vw');
    container?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.querySelector<HTMLElement>('.cdk-overlay-backdrop')?.click();
    tick();
    expect(dialog.openDialogs.length).toBe(1);
    expect(document.querySelectorAll('.cdk-focus-trap-anchor').length).toBe(2);
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');
    document.querySelector<HTMLButtonElement>('[aria-label="Widget schließen"]')?.click();
    tick();
    expect(request.cancelled).toBeTrue();
    expect(dialog.openDialogs.length).toBe(0);
  }));

  it('restores focus to the requesting player iframe without sending a return', fakeAsync(() => {
    const player = document.createElement('iframe');
    fixture.nativeElement.appendChild(player);
    const playerWindow = player.contentWindow;
    if (!playerWindow) throw new Error('Player iframe has no window');
    component['iFrameItemplayer'] = player;
    const postMessage = spyOn(playerWindow, 'postMessage');
    openWidget(playerWindow);
    tick();
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');
    const anchors = document.querySelectorAll<HTMLElement>('.cdk-focus-trap-anchor');
    anchors[1].focus();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Widget schließen');
    document.querySelector<HTMLButtonElement>('[aria-label="Widget schließen"]')?.click();
    tick();
    expect(request.cancelled).toBeTrue();
    expect(document.activeElement).toBe(player);
    expect(postMessage).not.toHaveBeenCalled();
  }));

  it('ignores repeated calls while loading and after download, and never executes HTML', fakeAsync(() => {
    spyOn(console, 'warn');
    openWidget();
    openWidget();
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');
    request.flush('<script>throw new Error("must not execute")</script>');
    openWidget();
    tick();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(1);
    expect(TestBed.inject(MatDialog).openDialogs[0].componentInstance.status()).toBe('loaded');
    expect(document.querySelector('[role="dialog"] iframe')).toBeNull();
    expect(console.warn).toHaveBeenCalledTimes(2);
    TestBed.inject(MatDialog).closeAll();
    tick();
  }));

  it('shows download errors inside the modal', fakeAsync(() => {
    spyOn(console, 'error');
    openWidget();
    http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html').flush('error', {
      status: 500, statusText: 'Server Error'
    });
    fixture.detectChanges();
    tick();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('konnte nicht geladen werden');
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(1);
    TestBed.inject(MatDialog).closeAll();
    tick();
  }));

  for (const transition of ['unit', 'pause', 'terminate', 'logout']) {
    it(`cancels the download and closes on ${transition}`, fakeAsync(() => {
      openWidget();
      const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');
      switch (transition) {
      case 'unit': MockTestControllerService.currentUnitSequenceId$.next(2); break;
      case 'pause': MockTestControllerService.state$.next('PAUSED'); break;
      case 'terminate': MockTestControllerService.state$.next('TERMINATED'); break;
      case 'logout': MockMainDataService.authData$.next(null); break;
      }
      tick();
      expect(request.cancelled).toBeTrue();
      expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    }));
  }

  it('gives another dialog priority and prevents calls while it remains open', fakeAsync(() => {
    openWidget();
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');
    const dialog = TestBed.inject(MatDialog);
    dialog.open(WidgetDialogComponent, {
      data: { status: signal<WidgetDialogStatus>('loaded') }
    });
    fixture.detectChanges();
    tick();
    expect(request.cancelled).toBeTrue();
    expect(dialog.openDialogs.length).toBe(1);
    openWidget();
    http.expectNone('/api/file/test-group/ws_1/Resource/periodic.html');
    dialog.closeAll();
    tick();
  }));

  it('keeps each controller-owned service independent and disposes it with its owner', fakeAsync(() => {
    const owner = TestBed.createComponent(WidgetServiceOwnerComponent);
    const otherOwner = TestBed.createComponent(WidgetServiceOwnerComponent);
    expect(owner.componentInstance.widgets).not.toBe(otherOwner.componentInstance.widgets);
    expect(owner.componentInstance.widgets).not.toBe(TestBed.inject(WidgetService));
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    owner.componentInstance.widgets.open({
      call: { widgetType: 'PERIODIC_TABLE' }, source: window, playerIframe: null
    });
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');
    owner.destroy();
    tick();
    expect(request.cancelled).toBeTrue();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    otherOwner.destroy();
  }));

});
