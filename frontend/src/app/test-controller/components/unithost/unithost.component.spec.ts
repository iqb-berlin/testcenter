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
import { VeronaAPIService } from '../../services/verona-api.service';
import { MessageService } from '../../../shared/services/message.service';
import { AppError } from '../../../app.interfaces';

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
  testMode: { saveResponses: true },
  testId: 'routing-regression',
  currentUnitSequenceId: 1,
  currentUnitSequenceId$: new BehaviorSubject(1),
  state$: new BehaviorSubject('RUNNING'),
  runReset$: new Subject<void>(),
  sharedParameters: [{ key: 'shared', value: '' }],
  addSharedParameters: jasmine.createSpy('addSharedParameters'),
  currentUnit: getTestData().Units.u1,
  getUnit: () => getTestData().Units.u1,
  AddToUnitStateBuffer: jasmine.createSpy('AddToUnitStateBuffer'),
  AddToUnitStateDataPartsBuffer: jasmine.createSpy('AddToUnitStateDataPartsBuffer'),
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
  let playerReturns: WeakMap<Window, jasmine.Spy>;

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
    playerReturns = new WeakMap();
    MockTestControllerService.currentUnitSequenceId$.next(1);
    MockTestControllerService.state$.next('RUNNING');
    MockTestControllerService.addSharedParameters.calls.reset();
    MockTestControllerService.AddToUnitStateBuffer.calls.reset();
    MockTestControllerService.AddToUnitStateDataPartsBuffer.calls.reset();
    MockTestControllerService.getWidgetResourcePath.calls.reset();
    MockTestControllerService.getWidgetResourcePath.and.returnValue(undefined);
    MockMainDataService.appConfig.fileServiceUri = '';
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UnithostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    const player = document.createElement('iframe');
    fixture.nativeElement.appendChild(player);
    component['iFrameItemplayer'] = player;
    if (!player.contentWindow) throw new Error('No player window');
    TestBed.inject(VeronaAPIService).postMessageTarget = player.contentWindow;
    component['playerSessions'].set(player.contentWindow, 'u1');
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

    MockMainDataService.postMessage$.next(new MessageEvent('message', { data: call, source: component['iFrameItemplayer']?.contentWindow ?? null }));

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

    MockMainDataService.postMessage$.next(new MessageEvent('message', { data: call, source: component['iFrameItemplayer']?.contentWindow ?? null }));

    expect(log).toHaveBeenCalledOnceWith('No uploaded widget found for vopWidgetCall:', call);
    expect(warn).not.toHaveBeenCalled();
  });

  it('should report a widget download failure without logging success', () => {
    const log = spyOn(console, 'log');
    const error = spyOn(console, 'error');
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/missing.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: component['iFrameItemplayer']?.contentWindow ?? null
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
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: component['iFrameItemplayer']?.contentWindow ?? null
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
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: component['iFrameItemplayer']?.contentWindow ?? null
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
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: component['iFrameItemplayer']?.contentWindow ?? null
    }));
    fixture.detectChanges();
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');

    fixture.destroy();
    expect(request.cancelled).toBeTrue();
    expect(log).toHaveBeenCalledTimes(1);
  });
  function openWidget(source = component['iFrameItemplayer']?.contentWindow): void {
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

  it('ignores repeated calls while loading and starting', fakeAsync(() => {
    spyOn(console, 'warn');
    openWidget();
    openWidget();
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');
    request.flush('<html>widget</html>');
    openWidget();
    tick();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(1);
    expect(TestBed.inject(MatDialog).openDialogs[0].componentInstance.status()).toBe('starting');
    expect(document.querySelector('[role="dialog"] iframe')).not.toBeNull();
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
      data: { status: signal<WidgetDialogStatus>('running') }
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
      call: { widgetType: 'PERIODIC_TABLE' }, source: component['iFrameItemplayer']?.contentWindow ?? null, playerIframe: null
    });
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');
    owner.destroy();
    tick();
    expect(request.cancelled).toBeTrue();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    otherOwner.destroy();
  }));

  const metadata = {
    id: 'periodic-table', type: 'WIDGET', model: 'PERIODIC_TABLE', version: '1.0.0',
    specVersion: '1.0', metadataVersion: '3.1', name: [{ lang: 'de', value: 'Periodensystem' }]
  };

  function loadedIframe(resourcePath = 'Resource/periodic.html'): HTMLIFrameElement {
    http.expectOne(`/api/file/test-group/ws_1/${resourcePath}`).flush('<html>widget</html>');
    tick();
    const iframe = document.querySelector<HTMLIFrameElement>('[role="dialog"] iframe');
    if (!iframe?.contentWindow) throw new Error('Widget iframe is missing');
    return iframe;
  }

  it('starts only its own widget once with a separate session, arrays, and explicit empty state', fakeAsync(() => {
    const playerWindow = component['iFrameItemplayer']?.contentWindow;
    if (!playerWindow) throw new Error('Missing player window');
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      source: playerWindow,
      data: { type: 'vopWidgetCall', sessionId: 'u1', callId: 'button', widgetType: 'PERIODIC_TABLE',
        parameters: [{ key: 'empty' }, { key: 'mode', value: 'select' }], state: '' }
    }));
    fixture.detectChanges();
    const iframe = loadedIframe();
    const widgetWindow = iframe.contentWindow;
    if (!widgetWindow) throw new Error('Missing widget window');
    const start = spyOn(widgetWindow, 'postMessage');
    const ready = { type: 'vowReadyNotification', metadata: JSON.stringify(metadata) };
    MockMainDataService.postMessage$.next(new MessageEvent('message', { source: window, data: ready }));
    expect(start).not.toHaveBeenCalled();
    MockMainDataService.postMessage$.next(new MessageEvent('message', { source: widgetWindow, data: ready }));
    MockMainDataService.postMessage$.next(new MessageEvent('message', { source: widgetWindow, data: ready }));
    expect(start).toHaveBeenCalledTimes(1);
    const command = start.calls.mostRecent().args[0];
    expect(command.type).toBe('vowStartCommand');
    expect(command.sessionId).toMatch(/^[0-9a-f]{32}$/);
    expect(command.sessionId).not.toBe('u1');
    expect(command.parameters).toEqual([{ key: 'empty', value: '' }, { key: 'mode', value: 'select' }]);
    expect(command.sharedParameters).toEqual([{ key: 'shared', value: '' }]);
    expect(command.state).toBe('');
    expect(command.callId).toBeUndefined();
    expect(iframe.title).toBe('Periodensystem');
    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Periodensystem');
    expect(TestBed.inject(VeronaAPIService).postMessageTarget).toBe(playerWindow);
    const playerMessage = spyOn(playerWindow!, 'postMessage');
    TestBed.inject(VeronaAPIService).sendPageNav('u1', '#next');
    expect(playerMessage).toHaveBeenCalled();
    tick(15000);
    expect(TestBed.inject(MatDialog).openDialogs[0].componentInstance.status()).toBe('running');
    TestBed.inject(MatDialog).closeAll();
    tick();
  }));

  it('shows a startup error at 15 seconds and ignores ready messages after failure', fakeAsync(() => {
    spyOn(console, 'error');
    openWidget();
    const iframe = loadedIframe();
    const source = iframe.contentWindow;
    tick(14999);
    expect(TestBed.inject(MatDialog).openDialogs[0].componentInstance.status()).toBe('starting');
    tick(1);
    expect(TestBed.inject(MatDialog).openDialogs[0].componentInstance.status()).toBe('startup-error');
    expect(document.querySelector('[role="dialog"] iframe')).toBeNull();
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      source, data: { type: 'vowReadyNotification', metadata: JSON.stringify(metadata) }
    }));
    expect(TestBed.inject(MatDialog).openDialogs[0].componentInstance.status()).toBe('startup-error');
    TestBed.inject(MatDialog).closeAll();
    tick();
  }));

  for (const invalidMetadata of ['{', JSON.stringify({ ...metadata, model: 'OTHER' }),
    JSON.stringify({ ...metadata, type: 'PLAYER' }), JSON.stringify({ ...metadata, specVersion: '2.0' })]) {
    it(`rejects invalid ready metadata ${invalidMetadata}`, fakeAsync(() => {
      spyOn(console, 'error');
      openWidget();
      const iframe = loadedIframe();
      MockMainDataService.postMessage$.next(new MessageEvent('message', {
        source: iframe.contentWindow, data: { type: 'vowReadyNotification', metadata: invalidMetadata }
      }));
      expect(TestBed.inject(MatDialog).openDialogs[0].componentInstance.status()).toBe('startup-error');
      expect(document.querySelector('[role="dialog"] iframe')).toBeNull();
      TestBed.inject(MatDialog).closeAll();
      tick(15000);
    }));
  }

  it('preserves an outgoing player state without redirecting commands to it', () => {
    const outgoing = document.createElement('iframe');
    fixture.nativeElement.appendChild(outgoing);
    const outgoingWindow = outgoing.contentWindow;
    if (!outgoingWindow) throw new Error('Missing outgoing window');
    component['playerSessions'].set(outgoingWindow, 'u1');
    const handleState = spyOn<any>(component, 'handleStateChangedNotification');
    const currentTarget = TestBed.inject(VeronaAPIService).postMessageTarget;
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      source: outgoingWindow, data: { type: 'vopStateChangedNotification', sessionId: 'u1', unitState: {} }
    }));
    expect(handleState).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(VeronaAPIService).postMessageTarget).toBe(currentTarget);
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      source: outgoingWindow, data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }
    }));
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
  });

  it('saves final state while the outgoing iframe is detached and the next player is still loading', async () => {
    const outgoing = component['iFrameItemplayer'];
    const source = outgoing?.contentWindow;
    if (!outgoing || !source) throw new Error('Missing outgoing player');
    outgoing.remove();
    expect(outgoing.contentWindow).toBeNull();
    await component['handleIncomingMessage'](new MessageEvent('message', {
      source,
      data: { type: 'vopStateChangedNotification', sessionId: 'u1', unitState: { dataParts: { final: 'saved' } } }
    }));
    expect(MockTestControllerService.AddToUnitStateDataPartsBuffer).toHaveBeenCalledOnceWith(
      getTestData().Units.u1.sequenceId, { final: 'saved' }, ''
    );
    await component['handleIncomingMessage'](new MessageEvent('message', {
      source: window,
      data: { type: 'vopStateChangedNotification', sessionId: 'u1', unitState: { dataParts: { final: 'untrusted' } } }
    }));
    expect(MockTestControllerService.AddToUnitStateDataPartsBuffer).toHaveBeenCalledTimes(1);
  });

  it('logs startup errors without a session against the current unit and raises the player error', async () => {
    const message = 'Player failed before accepting the start command';
    const handling = component['handleIncomingMessage'](new MessageEvent('message', {
      source: component['iFrameItemplayer']?.contentWindow,
      data: { type: 'vopRuntimeErrorNotification', sessionId: '', code: 'runtime-error', message }
    }));
    const unit = MockTestControllerService.currentUnit;
    const request = http.expectOne(`/api/test/routing-regression/unit/${unit.alias}/log`);
    expect(request.request.body).toEqual({
      originalUnitId: unit.id,
      logEntries: [{ key: 'Runtime Error: runtime-error', content: message, timeStamp: jasmine.any(Number) }]
    });
    request.flush(null);
    await expectAsync(handling).toBeRejectedWith(jasmine.any(AppError));
    await component['handleIncomingMessage'](new MessageEvent('message', {
      source: window,
      data: { type: 'vopRuntimeErrorNotification', sessionId: '', code: 'runtime-error', message }
    }));
    http.expectNone(`/api/test/routing-regression/unit/${unit.alias}/log`);
  });

  it('executes downloaded HTML and completes the real browser ready/start exchange', done => {
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    const listener = (event: MessageEvent): void => {
      if (event.data?.type === 'vowReadyNotification') MockMainDataService.postMessage$.next(event);
      if (event.data?.type === 'testWidgetStarted') {
        window.removeEventListener('message', listener);
        expect(event.data.command.type).toBe('vowStartCommand');
        expect(event.data.command.parameters).toEqual([]);
        expect(event.data.command.state).toBeUndefined();
        expect(TestBed.inject(MatDialog).openDialogs[0].componentInstance.status()).toBe('running');
        done();
      }
    };
    window.addEventListener('message', listener);
    openWidget();
    const html = `<script>
      window.addEventListener('message', event => {
        if (event.data.type === 'vowStartCommand') {
          parent.postMessage({type: 'testWidgetStarted', command: event.data}, '*');
        }
      });
      parent.postMessage({type: 'vowReadyNotification', metadata: ${JSON.stringify(JSON.stringify(metadata))}}, '*');
    </script>`;
    http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html').flush(html);
  });

  it('accepts the actual final state emitted when an outgoing iframe unloads', done => {
    const outgoing = document.createElement('iframe');
    fixture.nativeElement.appendChild(outgoing);
    const outgoingWindow = outgoing.contentWindow;
    if (!outgoingWindow) throw new Error('Missing outgoing player');
    component['playerSessions'].set(outgoingWindow, 'u1');
    const currentTarget = TestBed.inject(VeronaAPIService).postMessageTarget;
    const listener = (event: MessageEvent): void => {
      if (event.data?.type === 'testOutgoingReady') outgoing.remove();
      if (event.data?.type === 'vopStateChangedNotification' && event.data.unitState?.dataParts?.final === 'saved') {
        window.removeEventListener('message', listener);
        MockMainDataService.postMessage$.next(event);
        expect(MockTestControllerService.AddToUnitStateDataPartsBuffer).toHaveBeenCalledWith(
          getTestData().Units.u1.sequenceId, { final: 'saved' }, ''
        );
        expect(TestBed.inject(VeronaAPIService).postMessageTarget).toBe(currentTarget);
        done();
      }
    };
    window.addEventListener('message', listener);
    outgoing.srcdoc = `<script>
      window.addEventListener('unload', () => parent.postMessage({
        type: 'vopStateChangedNotification', sessionId: 'u1', unitState: {dataParts: {final: 'saved'}}
      }, '*'));
      parent.postMessage({type: 'testOutgoingReady'}, '*');
    </script>`;
  });

  function runningWidget(initialState?: string, resourcePath = 'Resource/periodic.html',
                         service?: WidgetService) {
    const playerWindow = component['iFrameItemplayer']?.contentWindow;
    if (!playerWindow) throw new Error('Missing player window');
    MockTestControllerService.getWidgetResourcePath.and.returnValue(resourcePath);
    const call = { type: 'vopWidgetCall', sessionId: 'u1', callId: 'button-1',
      widgetType: 'PERIODIC_TABLE', ...(initialState !== undefined ? { state: initialState } : {}) };
    if (service) service.open({ call, source: playerWindow, playerIframe: component['iFrameItemplayer'] });
    else MockMainDataService.postMessage$.next(new MessageEvent('message', { source: playerWindow, data: call }));
    fixture.detectChanges();
    const iframe = loadedIframe(resourcePath);
    const widgetWindow = iframe.contentWindow;
    if (!widgetWindow) throw new Error('Missing widget window');
    const start = spyOn(widgetWindow, 'postMessage');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      source: widgetWindow, data: { type: 'vowReadyNotification', metadata: JSON.stringify(metadata) }
    }));
    const sessionId = start.calls.mostRecent().args[0].sessionId;
    const returned = playerReturns.get(playerWindow) ?? spyOn(playerWindow, 'postMessage');
    playerReturns.set(playerWindow, returned);
    const send = (type: string, fields: object = {}, source: MessageEventSource = widgetWindow): void => {
      MockMainDataService.postMessage$.next(new MessageEvent('message', {
        source, data: { type, sessionId, timeStamp: '2026-10-14T12:00:00Z', ...fields }
      }));
    };
    return { send, returned, sessionId, widgetWindow, command: start.calls.mostRecent().args[0] };
  }

  it('returns final state with the original player session and call ID exactly once', fakeAsync(() => {
    const { send, returned } = runningWidget('initial');
    send('vowStateChangedNotification', { state: 'interim' });
    TestBed.inject(VeronaAPIService).postMessageTarget = window;
    send('vowReturnRequested', { state: 'final' });
    send('vowReturnRequested', { state: 'duplicate' });
    tick();
    expect(returned).toHaveBeenCalledOnceWith({
      type: 'vopWidgetReturn', sessionId: 'u1', callId: 'button-1', state: 'final'
    }, '*');
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    expect(document.querySelector('[role="dialog"] iframe')).toBeNull();
  }));

  it('preserves an empty interim state when return omits state', fakeAsync(() => {
    const { send, returned } = runningWidget('initial');
    send('vowStateChangedNotification', { state: '' });
    send('vowReturnRequested');
    tick();
    expect(returned.calls.mostRecent().args[0].state).toBe('');
  }));

  it('applies an empty final state and honors explicit saveState true', fakeAsync(() => {
    const { send, returned } = runningWidget('initial');
    send('vowReturnRequested', { state: '', saveState: true });
    tick();
    expect(returned.calls.mostRecent().args[0].state).toBe('');
  }));

  it('returns the call state when no widget state update was received', fakeAsync(() => {
    const { send, returned } = runningWidget('initial');
    send('vowReturnRequested');
    tick();
    expect(returned.calls.mostRecent().args[0].state).toBe('initial');
  }));

  it('keeps missing state absent in the player return', fakeAsync(() => {
    const { send, returned } = runningWidget();
    send('vowReturnRequested');
    tick();
    expect(Object.hasOwn(returned.calls.mostRecent().args[0], 'state')).toBeFalse();
  }));

  it('closes without a return when saveState is false', fakeAsync(() => {
    const { send, returned } = runningWidget();
    send('vowStateChangedNotification', { state: 'interim' });
    send('vowReturnRequested', { state: 'final', saveState: false });
    tick();
    expect(returned).not.toHaveBeenCalled();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
  }));

  it('orders state by timestamp, accepts equal times, and closes on a stale return', fakeAsync(() => {
    const { send, returned } = runningWidget();
    send('vowStateChangedNotification', { state: 'newest', timeStamp: '2026-10-14T12:00:02Z' });
    send('vowStateChangedNotification', { state: 'stale', timeStamp: '2026-10-14T12:00:01Z' });
    send('vowStateChangedNotification', { state: 'equal', timeStamp: '2026-10-14T14:00:02+02:00' });
    send('vowReturnRequested', { state: 'stale final', timeStamp: '2026-10-14T12:00:01Z' });
    tick();
    expect(returned.calls.mostRecent().args[0].state).toBe('equal');
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
  }));

  it('rejects wrong sources and sessions without accepting their state or closing', fakeAsync(() => {
    spyOn(console, 'warn');
    const { send, returned } = runningWidget('initial');
    send('vowStateChangedNotification', { state: 'wrong source' }, window);
    send('vowReturnRequested', { state: 'wrong source' }, window);
    send('vowStateChangedNotification', { state: 'wrong session', sessionId: 'other' });
    send('vowReturnRequested', { state: 'wrong session', sessionId: 'other' });
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(1);
    send('vowReturnRequested');
    tick();
    expect(returned.calls.mostRecent().args[0].state).toBe('initial');
  }));

  it('rejects malformed timestamps and payloads while keeping the widget open', fakeAsync(() => {
    spyOn(console, 'warn');
    const { send, returned } = runningWidget('initial');
    for (const timeStamp of ['invalid', '2026-02-30T12:00:00Z', '2026-10-14', '2026-10-14T24:00:00Z']) {
      send('vowStateChangedNotification', { state: 'invalid', timeStamp });
      send('vowReturnRequested', { state: 'invalid', timeStamp });
    }
    send('vowReturnRequested', { saveState: 'false' });
    send('vowReturnRequested', { state: null });
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(1);
    expect(returned).not.toHaveBeenCalled();
    send('vowReturnRequested');
    tick();
    expect(returned.calls.mostRecent().args[0].state).toBe('initial');
  }));

  it('suppresses late returns after cancellation or a forced transition', fakeAsync(() => {
    const { send, returned } = runningWidget();
    MockTestControllerService.state$.next('PAUSED');
    send('vowReturnRequested', { state: 'late' });
    tick();
    expect(returned).not.toHaveBeenCalled();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
  }));

  it('completes a real browser ready, state, and return exchange back to the player', done => {
    const player = component['iFrameItemplayer']?.contentWindow;
    if (!player) throw new Error('Missing player');
    const listener = (event: MessageEvent): void => {
      if (event.data?.type?.startsWith('vow')) MockMainDataService.postMessage$.next(event);
    };
    const playerListener = (event: MessageEvent): void => {
      if (event.data?.type !== 'vopWidgetReturn') return;
      window.removeEventListener('message', listener);
      player.removeEventListener('message', playerListener);
      expect(event.data).toEqual({ type: 'vopWidgetReturn', sessionId: 'u1', state: 'final browser state' });
      done();
    };
    window.addEventListener('message', listener);
    player.addEventListener('message', playerListener);
    openWidget();
    const html = `<script>
      window.addEventListener('message', event => {
        if (event.data.type !== 'vowStartCommand') return;
        const sessionId = event.data.sessionId;
        const timeStamp = new Date().toISOString();
        parent.postMessage({type: 'vowStateChangedNotification', sessionId, timeStamp, state: 'interim'}, '*');
        parent.postMessage({type: 'vowReturnRequested', sessionId, timeStamp, state: 'final browser state'}, '*');
      });
      parent.postMessage({type: 'vowReadyNotification', metadata: ${JSON.stringify(JSON.stringify(metadata))}}, '*');
    </script>`;
    http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html').flush(html);
  });

  function cancelWidget(): void {
    document.querySelector<HTMLButtonElement>('[aria-label="Widget schließen"]')?.click();
    tick();
  }

  it('restores interim state after cancellation and a unit change without persisting it', fakeAsync(() => {
    const first = runningWidget();
    first.send('vowStateChangedNotification', { state: 'selection' });
    cancelWidget();
    MockTestControllerService.currentUnitSequenceId$.next(2);
    const second = runningWidget();
    expect(second.command.state).toBe('selection');
    expect(first.returned).not.toHaveBeenCalled();
    expect(MockTestControllerService.AddToUnitStateBuffer).not.toHaveBeenCalled();
    expect(MockTestControllerService.AddToUnitStateDataPartsBuffer).not.toHaveBeenCalled();
    cancelWidget();
  }));

  it('restores final state after a normal return', fakeAsync(() => {
    const first = runningWidget();
    first.send('vowReturnRequested', { state: 'final' });
    tick();
    expect(runningWidget().command.state).toBe('final');
    cancelWidget();
  }));

  it('lets explicit state override cached state, including an empty string', fakeAsync(() => {
    runningWidget('old');
    cancelWidget();
    expect(runningWidget('override').command.state).toBe('override');
    cancelWidget();
    expect(runningWidget('').command.state).toBe('');
    cancelWidget();
    expect(runningWidget().command.state).toBe('');
    cancelWidget();
  }));

  it('retains empty received state and saveState false without a player return', fakeAsync(() => {
    const first = runningWidget('old');
    first.send('vowReturnRequested', { state: '', saveState: false });
    tick();
    expect(first.returned).not.toHaveBeenCalled();
    expect(runningWidget().command.state).toBe('');
    cancelWidget();
  }));

  it('isolates resource paths and starts each call with fresh timestamp ordering', fakeAsync(() => {
    const first = runningWidget();
    first.send('vowStateChangedNotification', { state: 'first file', timeStamp: '2026-10-14T12:00:10Z' });
    cancelWidget();
    const other = runningWidget(undefined, 'Resource/other.html');
    expect(Object.hasOwn(other.command, 'state')).toBeFalse();
    other.send('vowStateChangedNotification', { state: 'other file' });
    cancelWidget();
    const reopened = runningWidget();
    expect(reopened.command.state).toBe('first file');
    reopened.send('vowStateChangedNotification', { state: 'fresh call', timeStamp: '2026-10-14T12:00:00Z' });
    cancelWidget();
    expect(runningWidget().command.state).toBe('fresh call');
    cancelWidget();
  }));

  it('preserves state through pause and resume', fakeAsync(() => {
    const first = runningWidget();
    first.send('vowStateChangedNotification', { state: 'paused selection' });
    MockTestControllerService.state$.next('PAUSED');
    tick();
    MockTestControllerService.state$.next('RUNNING');
    expect(runningWidget().command.state).toBe('paused selection');
    cancelWidget();
  }));

  it('clears state on test reload and ignores messages from the old call', fakeAsync(() => {
    const first = runningWidget();
    first.send('vowStateChangedNotification', { state: 'old run' });
    MockTestControllerService.runReset$.next();
    first.send('vowStateChangedNotification', { state: 'late old run' });
    tick();
    expect(Object.hasOwn(runningWidget().command, 'state')).toBeFalse();
    cancelWidget();
  }));

  it('discards state when the controller owner is destroyed', fakeAsync(() => {
    const owner = TestBed.createComponent(WidgetServiceOwnerComponent);
    const firstPlayer = document.createElement('iframe');
    owner.nativeElement.appendChild(firstPlayer);
    component['iFrameItemplayer'] = firstPlayer;
    const first = runningWidget(undefined, 'Resource/periodic.html', owner.componentInstance.widgets);
    first.send('vowStateChangedNotification', { state: 'old owner' });
    owner.destroy();
    tick();
    const nextOwner = TestBed.createComponent(WidgetServiceOwnerComponent);
    const nextPlayer = document.createElement('iframe');
    nextOwner.nativeElement.appendChild(nextPlayer);
    component['iFrameItemplayer'] = nextPlayer;
    const next = runningWidget(undefined, 'Resource/periodic.html', nextOwner.componentInstance.widgets);
    expect(Object.hasOwn(next.command, 'state')).toBeFalse();
    nextOwner.destroy();
    tick();
  }));

  it('applies interim and final shared parameters, including empty values and saveState false', fakeAsync(() => {
    const { send, returned } = runningWidget();
    send('vowStateChangedNotification', { sharedParameters: [{ key: 'shared', value: 'changed' }] });
    send('vowReturnRequested', { sharedParameters: [{ key: 'shared', value: '' }], saveState: false });
    tick();
    expect(MockTestControllerService.addSharedParameters.calls.allArgs()).toEqual([
      [[{ key: 'shared', value: 'changed' }]], [[{ key: 'shared', value: '' }]]
    ]);
    expect(returned).not.toHaveBeenCalled();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
  }));

  it('filters shared parameters by source, session, and timestamp, including stale final returns', fakeAsync(() => {
    spyOn(console, 'warn');
    const { send } = runningWidget();
    send('vowStateChangedNotification', { sharedParameters: [{ key: 'shared', value: 'wrong source' }] }, window);
    send('vowStateChangedNotification', {
      sharedParameters: [{ key: 'shared', value: 'wrong session' }], sessionId: 'other'
    });
    send('vowStateChangedNotification', {
      sharedParameters: [{ key: 'shared', value: 'newest' }], timeStamp: '2026-10-14T12:00:02Z'
    });
    send('vowStateChangedNotification', {
      sharedParameters: [{ key: 'shared', value: 'stale' }], timeStamp: '2026-10-14T12:00:01Z'
    });
    send('vowStateChangedNotification', {
      sharedParameters: [{ key: 'shared', value: 'equal' }], timeStamp: '2026-10-14T12:00:02Z'
    });
    send('vowReturnRequested', { sharedParameters: [{ key: 'shared', value: 'stale final' }] });
    tick();
    expect(MockTestControllerService.addSharedParameters.calls.allArgs()).toEqual([
      [[{ key: 'shared', value: 'newest' }]], [[{ key: 'shared', value: 'equal' }]]
    ]);
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
  }));

  it('rejects malformed shared parameters without applying partial updates or closing', fakeAsync(() => {
    spyOn(console, 'warn');
    const { send, returned } = runningWidget('initial');
    for (const sharedParameters of [null, {}, [{ key: 'shared' }], [{ key: 'x', value: 'bad' }],
      [{ key: 'shared', value: 0 }], [{ key: 'valid', value: 'yes' }, { key: 'broken' }]]) {
      send('vowStateChangedNotification', { sharedParameters, state: 'invalid' });
      send('vowReturnRequested', { sharedParameters, state: 'invalid' });
    }
    expect(MockTestControllerService.addSharedParameters).not.toHaveBeenCalled();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(1);
    send('vowReturnRequested');
    tick();
    expect(returned.calls.mostRecent().args[0].state).toBe('initial');
  }));

});
