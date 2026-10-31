import { provideLocationMocks } from '@angular/common/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, Subject } from 'rxjs';
import { CustomtextService, MainDataService } from '@shared/shared.module';
import { BackendService } from './backend.service';
import { TestControllerService } from './test-controller.service';
import { WidgetRuntimeService } from './widget-runtime.service';
import { TestControllerState } from '../interfaces/test-controller.interfaces';
import { WidgetDialogComponent } from '../components/widget-dialog/widget-dialog.component';

function metadata(model: string): string {
  return JSON.stringify({
    type: 'WIDGET', model, id: 'calculator', version: '1.0.0', specVersion: '1.0', metadataVersion: '3.1',
    name: [{ lang: 'de', value: 'Rechner' }]
  });
}

describe('WidgetRuntimeService', () => {
  let runtime: WidgetRuntimeService;
  let container: HTMLDivElement;
  let trigger: HTMLButtonElement;
  let http: HttpTestingController;
  let dialog: MatDialog;
  let messages: Subject<MessageEvent>;
  let reset: Subject<void>;
  let tcs: Pick<TestControllerService, 'workspaceId' | 'widgets' | 'getWidgetResourcePath' |
    'currentUnitSequenceId' | 'currentUnitSequenceId$' | 'state$' | 'runReset$' |
    'sharedParameters' | 'addSharedParameters'>;
  let mds: {
    postMessage$: Subject<MessageEvent>;
    authData$: Subject<void>;
    appConfig: { fileServiceUri: string };
    getAuthData: () => { groupToken: string };
  };

  beforeEach(() => {
    messages = new Subject<MessageEvent>();
    reset = new Subject<void>();
    tcs = {
      workspaceId: 1, widgets: { CALCULATOR: ['Resource/calculator.html'] },
      // Use the real workspace resolver, not a second implementation in the test setup.
      getWidgetResourcePath(model: string) {
        return TestControllerService.prototype.getWidgetResourcePath.call(this, model);
      },
      currentUnitSequenceId: 1, currentUnitSequenceId$: new BehaviorSubject(1),
      state$: new BehaviorSubject<TestControllerState>('RUNNING'), runReset$: reset,
      sharedParameters: [], addSharedParameters: jasmine.createSpy()
    };
    mds = {
      postMessage$: messages, authData$: new Subject<void>(), appConfig: { fileServiceUri: '' },
      getAuthData: () => ({ groupToken: 'calculator-group' })
    };
    TestBed.configureTestingModule({
      imports: [MatDialogModule, MatIconTestingModule],
      providers: [
        provideNoopAnimations(), provideHttpClient(), provideHttpClientTesting(),
        provideLocationMocks(), BackendService, WidgetRuntimeService,
        { provide: TestControllerService, useValue: tcs },
        { provide: MainDataService, useValue: mds },
        { provide: 'FILE_SERVER_URL', useValue: '/files/' },
        { provide: 'BACKEND_URL', useValue: '/api/' }
      ]
    });
    runtime = TestBed.inject(WidgetRuntimeService);
    container = document.createElement('div');
    trigger = document.createElement('button');
    container.appendChild(trigger);
    document.body.appendChild(container);
    http = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);
  });

  afterEach(() => {
    runtime.ngOnDestroy();
    container.remove();
    dialog.closeAll();
    http.verify();
  });

  function open(): void {
    runtime.openHost({ resourcePath: 'Resource/calculator.html', model: 'CALCULATOR', parameters: [], trigger });
  }

  function cancel(): void {
    document.querySelector<HTMLButtonElement>('[role="dialog"] button[mat-dialog-close]')?.click();
    tick();
  }

  function ready(model: string = 'CALCULATOR') {
    tick();
    const source = document.querySelector<HTMLIFrameElement>('[role="dialog"] iframe')?.contentWindow;
    if (!source) throw new Error('Missing calculator iframe');
    const post = spyOn(source, 'postMessage');
    messages.next(new MessageEvent('message', {
      source, data: { type: 'vowReadyNotification', metadata: metadata(model) }
    }));
    // postMessage is spied on above, so deliver its command to the widget explicitly.
    const command: unknown = post.calls.mostRecent().args[0];
    source.dispatchEvent(new MessageEvent('message', { source: window, data: command }));
    return { source, post };
  }

  function playerCall(state?: string) {
    const player = document.createElement('iframe');
    trigger.parentElement?.appendChild(player);
    const source = player.contentWindow!;
    const returned = spyOn(source, 'postMessage');
    runtime.open({
      call: { type: 'vopWidgetCall', sessionId: 'player', callId: 'call', widgetType: 'CALC', state },
      source, playerIframe: player
    });
    return returned;
  }

  it('downloads from the configured file server and returns final state once to the original player', fakeAsync(() => {
    mds.appConfig.fileServiceUri = 'configured';
    const returned = playerCall();
    http.expectOne('/files/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
    const { source, post } = ready();
    const command = post.calls.mostRecent().args[0] as { sessionId: string };
    const data = { type: 'vowReturnRequested', sessionId: command.sessionId,
      timeStamp: '2026-10-15T12:00:00Z', state: '' };
    messages.next(new MessageEvent('message', { source, data }));
    messages.next(new MessageEvent('message', { source, data }));
    tick();
    expect(returned).toHaveBeenCalledOnceWith({
      type: 'vopWidgetReturn', sessionId: 'player', callId: 'call', state: ''
    }, '*');
    expect(dialog.openDialogs.length).toBe(0);
  }));

  for (const transition of ['unit', 'pause', 'reset', 'logout', 'destroy', 'other dialog']) {
    it(`cancels downloads and suppresses focus restoration on ${transition}`, fakeAsync(() => {
      open();
      const download = http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html');
      open();
      http.expectNone('/api/file/calculator-group/ws_1/Resource/calculator.html');
      const focus = spyOn(trigger, 'focus');
      if (transition === 'unit') tcs.currentUnitSequenceId$.next(2);
      if (transition === 'pause') tcs.state$.next('PAUSED');
      if (transition === 'reset') reset.next();
      if (transition === 'logout') mds.authData$.next();
      if (transition === 'destroy') runtime.ngOnDestroy();
      if (transition === 'other dialog') dialog.open(WidgetDialogComponent, { data: { name: 'Other dialog' } });
      tick();
      expect(download.cancelled).toBeTrue();
      expect(focus).not.toHaveBeenCalled();
    }));
  }

  it('restores focus on user closure without returning state to the player', fakeAsync(() => {
    const returned = playerCall('initial');
    http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
    ready();
    const player = container.querySelector('iframe')!;
    const focus = spyOn(player, 'focus');
    cancel();
    expect(focus).toHaveBeenCalled();
    expect(returned).not.toHaveBeenCalled();
  }));

  it('shows custom unavailable text and download errors', fakeAsync(() => {
    TestBed.inject(CustomtextService).addCustomTexts({ booklet_widgetUnavailable: 'Ask the supervisor' });
    tcs.widgets = {};
    playerCall();
    tick();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Ask the supervisor');
    cancel();
    open();
    spyOn(console, 'error');
    http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html')
      .flush('missing', { status: 404, statusText: 'Not found' });
    tick();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('konnte nicht geladen werden');
    cancel();
  }));
  it('completes a real browser handshake and publishes the final accepted state on close', async () => {
    const forward = (event: MessageEvent): void => messages.next(event);
    window.addEventListener('message', forward);
    try {
      const closed = new Promise<string>((resolve) => {
        runtime.openHost({ resourcePath: 'Resource/calculator.html', model: 'CALCULATOR', parameters: [], trigger },
                         { onState: () => {}, onClosed: resolve });
      });
      http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush(`<script>
        addEventListener('message', event => {
          if (event.data.type !== 'vowStartCommand') return;
          parent.postMessage({type: 'vowReturnRequested', sessionId: event.data.sessionId,
            timeStamp: new Date().toISOString(), state: 'browser result'}, '*');
        });
        parent.postMessage({type: 'vowReadyNotification', metadata: ${JSON.stringify(metadata('CALCULATOR'))}}, '*');
      </script>`);
      expect(await closed).toBe('browser result');
      expect(dialog.openDialogs.length).toBe(0);
      expect(document.activeElement).toBe(trigger);
    } finally {
      window.removeEventListener('message', forward);
    }
  });
});
