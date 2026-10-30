import {
  ComponentFixture, fakeAsync, TestBed, tick, waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ApplicationRef } from '@angular/core';
import { WidgetRuntimeService } from '../../services/widget-runtime.service';
import { CalculatorService } from '../../services/calculator.service';
import { WidgetDialogComponent } from '../widget-dialog/widget-dialog.component';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AssetService } from '@shared/services/asset.service';
import { UnithostComponent } from './unithost.component';
import { TestControllerService } from '../../services/test-controller.service';
import { BackendService } from '../../services/backend.service';
import { MainDataService, BookletConfig, CustomtextService } from '../../../shared/shared.module';
import { VeronaNavigationDeniedReason } from '../../interfaces/verona.interfaces';
import { NavigationState } from '../../interfaces/test-controller.interfaces';
import { getTestData } from '../../test/test-data';
import { VeronaAPIService } from '../../services/verona-api.service';
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
  testMode: { saveResponses: true },
  testId: 'routing-regression',
  currentUnitSequenceId: 1,
  currentTimerId: '[0]',
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
  unitContentReady$: new BehaviorSubject(false),
  unitBlockResourcesLoaded$: () => of(undefined),
  addToTestStateBuffer: () => {},
  updateNavigationState: () => {},
  getPlayer: () => '<html></html>',
  navigationDenial$: new Subject<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }>(),
  navigation$: new Subject<NavigationState>(),
  configChanged$: new Subject<void>(),
  getWidgetResourcePath: jasmine.createSpy('getWidgetResourcePath')
};
const MockMainDataService = {
  postMessage$: new Subject(),
  authData$: new Subject(),
  appConfig: { fileServiceUri: '' },
  appSubTitle$: new Subject<string>(),
  getAuthData: () => ({ groupToken: 'test-group', viewSettings: {} })
};
const MockActivatedRoute = {
  params: new Subject<Params>(),
  queryParamMap: new Subject()
};
const MockAssetService = {
  getAssetSrc: () => ''
};

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
        MatDialogModule,
        MatIconTestingModule
      ],
      providers: [
        provideNoopAnimations(),
        { provide: TestControllerService, useValue: MockTestControllerService },
        BackendService,
        WidgetRuntimeService, CalculatorService,
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
    MockTestControllerService.sharedParameters = [{ key: 'shared', value: '' }];
    MockTestControllerService.addSharedParameters.calls.reset();
    MockTestControllerService.addSharedParameters.and.callFake(parameters => {
      for (const parameter of parameters) {
        const existing = MockTestControllerService.sharedParameters.find(item => item.key === parameter.key);
        if (existing) existing.value = parameter.value;
        else MockTestControllerService.sharedParameters.push({ ...parameter });
      }
    });
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
    MockActivatedRoute.params.next({ u: 1 });
    tick();
  }));

  afterEach(() => {
    fixture.destroy();
    http.verify();
  });

  function playerIframe(): HTMLIFrameElement {
    const player = fixture.nativeElement.querySelector('iframe.unitHost') as HTMLIFrameElement | null;
    if (!player) throw new Error('Missing player iframe');
    return player;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses custom text for unavailable player widgets and closes the message on a unit change', fakeAsync(() => {
    TestBed.inject(CustomtextService).addCustomTexts({ booklet_widgetUnavailable: 'Ask your supervisor for this tool' });
    const player = playerIframe();
    const source = player?.contentWindow;
    if (!player || !source) throw new Error('Missing player');
    const focus = spyOn(player, 'focus');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'UNKNOWN' }, source
    }));
    fixture.detectChanges();
    tick();
    TestBed.inject(ApplicationRef).tick();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Ask your supervisor for this tool');
    MockTestControllerService.currentUnitSequenceId$.next(2);
    tick();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    expect(focus).not.toHaveBeenCalled();
    http.expectNone(request => request.url.includes('/file/'));
  }));

  it('should cancel pending downloads when the unit host is destroyed', () => {
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: playerIframe()?.contentWindow ?? null
    }));
    fixture.detectChanges();
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');

    fixture.destroy();
    expect(request.cancelled).toBeTrue();
  });
  function openWidget(source = playerIframe()?.contentWindow): void {
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source
    }));
    fixture.detectChanges();
  }

  function dialogName(): string | null | undefined {
    TestBed.inject(ApplicationRef).tick();
    const nameId = document.querySelector('[role="dialog"]')?.getAttribute('aria-labelledby');
    return nameId ? document.getElementById(nameId)?.textContent?.trim() : undefined;
  }

  it('restores focus to the requesting player iframe without sending a return', fakeAsync(() => {
    const player = playerIframe();
    const playerWindow = player?.contentWindow;
    if (!player || !playerWindow) throw new Error('Player iframe has no window');
    const postMessage = spyOn(playerWindow, 'postMessage');
    openWidget(playerWindow);
    tick();
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');
    const closeButton = document.querySelector<HTMLButtonElement>('[role="dialog"] button[mat-dialog-close]');
    if (!closeButton) throw new Error('Missing close button');
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);
    document.querySelector<HTMLButtonElement>('[role="dialog"] button[mat-dialog-close]')?.click();
    tick();
    expect(request.cancelled).toBeTrue();
    expect(document.activeElement).toBe(player);
    expect(postMessage).not.toHaveBeenCalled();
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
      data: { name: 'System dialog' }
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

  function runningWidget(initialState?: string, resourcePath = 'Resource/periodic.html') {
    const playerWindow = playerIframe()?.contentWindow;
    if (!playerWindow) throw new Error('Missing player window');
    MockTestControllerService.getWidgetResourcePath.and.returnValue(resourcePath);
    const call = { type: 'vopWidgetCall', sessionId: 'u1', callId: 'button-1',
      widgetType: 'PERIODIC_TABLE', ...(initialState !== undefined ? { state: initialState } : {}) };
    MockMainDataService.postMessage$.next(new MessageEvent('message', { source: playerWindow, data: call }));
    fixture.detectChanges();
    const iframe = loadedIframe(resourcePath);
    const widgetWindow = iframe.contentWindow;
    if (!widgetWindow) throw new Error('Missing widget window');
    const start = spyOn(widgetWindow, 'postMessage');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      source: widgetWindow, data: { type: 'vowReadyNotification', metadata: JSON.stringify(metadata) }
    }));
    const command: unknown = start.calls.mostRecent().args[0];
    widgetWindow.dispatchEvent(new MessageEvent('message', { source: window, data: command }));
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

  it('closes without a return or retained state when saveState is false', fakeAsync(() => {
    const { send, returned } = runningWidget();
    send('vowStateChangedNotification', { state: 'interim' });
    send('vowReturnRequested', { state: '', saveState: false });
    tick();
    expect(returned).not.toHaveBeenCalled();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    expect(runningWidget().command.state).toBeUndefined();
    cancelWidget();
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

  for (const closure of ['cancellation', 'pause']) {
    it(`suppresses late returns after ${closure}`, fakeAsync(() => {
      const { send, returned } = runningWidget();
      if (closure === 'cancellation') cancelWidget();
      else MockTestControllerService.state$.next('PAUSED');
      send('vowReturnRequested', { state: 'late' });
      tick();
      expect(returned).not.toHaveBeenCalled();
      expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    }));
  }

  it('completes a real browser ready, state, and return exchange back to the player', async () => {
    const frame = playerIframe();
    const loaded = new Promise<void>(resolve => frame.addEventListener('load', () => resolve(), { once: true }));
    frame.srcdoc = '<html></html>';
    await loaded;
    const player = frame.contentWindow;
    if (!player) throw new Error('Missing player');
    const listener = (event: MessageEvent): void => {
      if (event.data?.type?.startsWith('vow')) MockMainDataService.postMessage$.next(event);
    };
    const returned = new Promise<MessageEvent>(resolve => {
      player.addEventListener('message', function playerListener(event: MessageEvent): void {
        if (event.data?.type !== 'vopWidgetReturn') return;
        player.removeEventListener('message', playerListener);
        resolve(event);
      });
    });
    window.addEventListener('message', listener);
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
    try {
      expect((await returned).data).toEqual({ type: 'vopWidgetReturn', sessionId: 'u1', state: 'final browser state' });
    } finally {
      window.removeEventListener('message', listener);
    }
  });

  function cancelWidget(): void {
    document.querySelector<HTMLButtonElement>('[role="dialog"] button[mat-dialog-close]')?.click();
    tick();
  }

  it('uses only explicit player state, including an empty string', fakeAsync(() => {
    runningWidget('old');
    cancelWidget();
    expect(runningWidget('override').command.state).toBe('override');
    cancelWidget();
    expect(runningWidget('').command.state).toBe('');
    cancelWidget();
    expect(runningWidget().command.state).toBeUndefined();
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
    expect(reopened.command.state).toBeUndefined();
    reopened.send('vowStateChangedNotification', { state: 'fresh call', timeStamp: '2026-10-14T12:00:00Z' });
    reopened.send('vowReturnRequested');
    tick();
    expect(reopened.returned.calls.mostRecent().args[0].state).toBe('fresh call');
    expect(runningWidget().command.state).toBeUndefined();
    cancelWidget();
  }));

  it('does not restore host state after pause and resume', fakeAsync(() => {
    const first = runningWidget();
    first.send('vowStateChangedNotification', { state: 'paused selection' });
    MockTestControllerService.state$.next('PAUSED');
    tick();
    MockTestControllerService.state$.next('RUNNING');
    expect(runningWidget().command.state).toBeUndefined();
    cancelWidget();
  }));

  it('applies interim and final shared parameters, including empty values and saveState false', fakeAsync(() => {
    const { send, returned } = runningWidget();
    send('vowStateChangedNotification', { sharedParameters: [{ key: 'shared', value: 'changed' }] });
    expect(MockTestControllerService.sharedParameters).toEqual([{ key: 'shared', value: 'changed' }]);
    send('vowReturnRequested', { sharedParameters: [{ key: 'shared', value: '' }], saveState: false });
    tick();
    expect(runningWidget().command.sharedParameters).toEqual([{ key: 'shared', value: '' }]);
    cancelWidget();
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
    expect(runningWidget().command.sharedParameters).toEqual([{ key: 'shared', value: 'equal' }]);
    cancelWidget();
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
    expect(MockTestControllerService.sharedParameters).toEqual([{ key: 'shared', value: '' }]);
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(1);
    send('vowReturnRequested');
    tick();
    expect(returned.calls.mostRecent().args[0].state).toBe('initial');
    expect(runningWidget().command.sharedParameters).toEqual([{ key: 'shared', value: '' }]);
    cancelWidget();
  }));

});
