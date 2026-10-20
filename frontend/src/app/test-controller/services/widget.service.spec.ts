import { Component, inject } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, Subject } from 'rxjs';
import { MainDataService, TestMode } from '@shared/shared.module';
import { BackendService } from './backend.service';
import { TestControllerService } from './test-controller.service';
import { WidgetService } from './widget.service';
import { TestControllerState } from '../interfaces/test-controller.interfaces';
import { WidgetDialogComponent } from '../components/widget-dialog/widget-dialog.component';
import { getTestData } from '../test/test-data';

@Component({
  imports: [MatDialogModule],
  template: '<button #trigger (click)="widgets.openCalculator({parameters, trigger})">Calculator</button>',
  providers: [WidgetService]
})
class CalculatorHostComponent {
  readonly widgets = inject(WidgetService);
  readonly parameters = [{ key: 'MODE', value: 'SCIENTIFIC' }];
}

function metadata(model: string): string {
  return JSON.stringify({
    type: 'WIDGET', model, id: 'calculator', version: '1.0.0', specVersion: '1.0', metadataVersion: '3.1',
    name: [{ lang: 'de', value: 'Rechner' }]
  });
}

describe('Uploaded calculator launch', () => {
  let fixture: ComponentFixture<CalculatorHostComponent>;
  let trigger: HTMLButtonElement;
  let http: HttpTestingController;
  let dialog: MatDialog;
  let messages: Subject<MessageEvent>;
  let reset: Subject<void>;
  let tcs: Pick<TestControllerService, 'workspaceId' | 'widgets' | 'getWidgetResourcePath' |
    'currentUnitSequenceId' | 'currentUnitSequenceId$' | 'state$' | 'runReset$' |
    'sharedParameters' | 'addSharedParameters' | 'testId' | 'testMode' | 'currentUnit'>;
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
      testId: 'calculator-run', testMode: new TestMode(),
      currentUnit: { ...getTestData().Units.u1, alias: 'MATH_01' },
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
      imports: [CalculatorHostComponent, MatIconTestingModule],
      providers: [
        provideNoopAnimations(), provideHttpClient(), provideHttpClientTesting(), BackendService,
        { provide: TestControllerService, useValue: tcs },
        { provide: MainDataService, useValue: mds },
        { provide: 'FILE_SERVER_URL', useValue: '/files/' },
        { provide: 'BACKEND_URL', useValue: '/api/' }
      ]
    });
    fixture = TestBed.createComponent(CalculatorHostComponent);
    fixture.detectChanges();
    const element: unknown = fixture.nativeElement;
    if (!(element instanceof HTMLElement)) throw new Error('Missing calculator host');
    const button = element.querySelector('button');
    if (!button) throw new Error('Missing calculator button');
    trigger = button;
    http = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);
  });

  afterEach(() => {
    fixture.destroy();
    dialog.closeAll();
    http.verify();
  });

  function view(): WidgetDialogComponent {
    const instance: unknown = dialog.openDialogs[0].componentInstance;
    if (!(instance instanceof WidgetDialogComponent)) throw new Error('Missing widget dialog');
    return instance;
  }

  function open(): void {
    trigger.click();
    fixture.detectChanges();
  }

  function cancel(): void {
    document.querySelector<HTMLButtonElement>('[aria-label="Widget schließen"]')?.click();
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
    return { source, post };
  }

  it('downloads the preferred uploaded resource through the authenticated path without a player', fakeAsync(() => {
    tcs.widgets = { CALC: ['Resource/calc.html'], CALCULATOR: ['Resource/old.html', 'Resource/calculator.html'] };
    open();
    expect(view().status()).toBe('loading');
    http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
    const { post } = ready();
    expect(view().status()).toBe('running');
    expect(post).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      type: 'vowStartCommand', parameters: fixture.componentInstance.parameters
    }), '*');
    cancel();
    expect(document.activeElement).toBe(trigger);
  }));

  it('falls back to CALC and accepts that model in the ready handshake', fakeAsync(() => {
    tcs.widgets = { CALCULATOR: [], CALC: ['Resource/calc.html'] };
    open();
    http.expectOne('/api/file/calculator-group/ws_1/Resource/calc.html').flush('<html></html>');
    expect(ready('CALC').post).toHaveBeenCalled();
    expect(view().status()).toBe('running');
    cancel();
  }));

  it('preserves player returns when a CALC request loads a CALCULATOR resource', fakeAsync(() => {
    const player = document.createElement('iframe');
    trigger.parentElement?.appendChild(player);
    const source = player.contentWindow;
    if (!source) throw new Error('Missing player window');
    const returned = spyOn(source, 'postMessage');
    fixture.componentInstance.widgets.open({
      call: { type: 'vopWidgetCall', sessionId: 'player-session', callId: 'calc-button', widgetType: 'CALC' },
      source, playerIframe: player
    });
    fixture.detectChanges();
    http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
    const widget = ready('CALCULATOR');
    const start: unknown = widget.post.calls.mostRecent().args[0];
    if (start === null || typeof start !== 'object' || !('sessionId' in start)) throw new Error('Missing start');
    messages.next(new MessageEvent('message', { source: widget.source, data: {
      type: 'vowReturnRequested', sessionId: start.sessionId, timeStamp: '2026-10-15T12:00:00Z', state: 'final'
    } }));
    tick();
    expect(returned).toHaveBeenCalledOnceWith({
      type: 'vopWidgetReturn', sessionId: 'player-session', callId: 'calc-button', state: 'final'
    }, '*');
    player.remove();
  }));

  it('uses the configured file server for calculator resources', fakeAsync(() => {
    mds.appConfig.fileServiceUri = 'configured';
    open();
    http.expectOne('/files/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
    ready();
    cancel();
  }));

  it('shows an actionable missing-resource error without downloading and permits a later retry', fakeAsync(() => {
    tcs.widgets = {};
    open();
    tick();
    expect(view().status()).toBe('missing-calculator');
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('CALCULATOR oder CALC');
    http.expectNone(request => request.url.includes('/file/'));
    cancel();
    tcs.widgets = { CALC: ['Resource/calc.html'] };
    open();
    http.expectOne('/api/file/calculator-group/ws_1/Resource/calc.html').flush('<html></html>');
    ready('CALC');
    cancel();
  }));

  it('reports a missing selected file without silently loading a different calculator', fakeAsync(() => {
    spyOn(console, 'error');
    tcs.widgets.CALC = ['Resource/calc.html'];
    open();
    http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html')
      .flush('missing', { status: 404, statusText: 'Not found' });
    tick();
    expect(view().status()).toBe('download-error');
    http.expectNone('/api/file/calculator-group/ws_1/Resource/calc.html');
    cancel();
  }));

  it('rejects a different model and retains the ready timeout', fakeAsync(() => {
    spyOn(console, 'error');
    open();
    http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
    expect(ready('PERIODIC_TABLE').post).not.toHaveBeenCalled();
    expect(view().status()).toBe('startup-error');
    cancel();
    open();
    http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
    tick(15000);
    expect(view().status()).toBe('startup-error');
    cancel();
  }));

  it('blocks repeated clicks and closes an in-flight download on a unit transition', fakeAsync(() => {
    open();
    const download = http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html');
    trigger.click();
    http.expectNone('/api/file/calculator-group/ws_1/Resource/calculator.html');
    const focus = spyOn(trigger, 'focus');
    tcs.currentUnitSequenceId$.next(2);
    tick();
    expect(download.cancelled).toBeTrue();
    expect(dialog.openDialogs.length).toBe(0);
    expect(focus).not.toHaveBeenCalled();
  }));

  for (const saveState of [true, false, undefined]) {
    it(`retains empty final state without a player return for saveState ${saveState}`, fakeAsync(() => {
      const parentPost = spyOn(window, 'postMessage');
      open();
      http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
      const { source, post } = ready();
      const start: unknown = post.calls.mostRecent().args[0];
      if (start === null || typeof start !== 'object' || !('sessionId' in start)) throw new Error('Missing start');
      messages.next(new MessageEvent('message', { source, data: {
        type: 'vowReturnRequested', sessionId: start.sessionId, timeStamp: '2026-10-15T12:00:00Z', state: '',
        ...(saveState !== undefined ? { saveState } : {})
      } }));
      tick();
      expect(parentPost).not.toHaveBeenCalled();
      expect(post).toHaveBeenCalledTimes(1);
      open();
      http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
      expect(ready().post).toHaveBeenCalledWith(jasmine.objectContaining({ state: '' }), '*');
      cancel();
      reset.next();
      fixture.componentInstance.widgets.openCalculator({ trigger, parameters: [], state: 'explicit' });
      fixture.detectChanges();
      http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
      expect(ready().post).toHaveBeenCalledWith(jasmine.objectContaining({ state: 'explicit' }), '*');
      cancel();
    }));
  }

  it('executes srcdoc and restores accepted state on a second browser handshake', async () => {
    const commands: unknown[] = [];
    const listener = (event: MessageEvent): void => {
      const data: unknown = event.data;
      if (data === null || typeof data !== 'object' || !('type' in data)) return;
      if (data.type === 'observedStart' && 'command' in data) commands.push(data.command);
      if (typeof data.type === 'string' && data.type.startsWith('vow')) messages.next(event);
    };
    window.addEventListener('message', listener);
    const html = `<script>
      addEventListener('message', event => {
        if (event.data.type !== 'vowStartCommand') return;
        const command = event.data;
        parent.postMessage({type: 'observedStart', command}, '*');
        parent.postMessage({type: 'vowReturnRequested', sessionId: command.sessionId,
          timeStamp: new Date().toISOString(), state: 'browser state', saveState: false}, '*');
      });
      parent.postMessage({type: 'vowReadyNotification', metadata: ${JSON.stringify(metadata('CALC'))}}, '*');
    </script>`;
    try {
      for (let count = 0; count < 2; count += 1) {
        const closed = new Promise<void>((resolve) => {
          const subscription = dialog.afterAllClosed.subscribe(() => {
            if (commands.length <= count) return;
            subscription.unsubscribe();
            resolve();
          });
        });
        open();
        http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush(html);
        await closed;
        expect(document.activeElement).toBe(trigger);
      }
      expect(commands.length).toBe(2);
      expect(commands[1]).toEqual(jasmine.objectContaining({ state: 'browser state' }));
    } finally {
      window.removeEventListener('message', listener);
    }
  });

  describe('persisted unit logs', () => {
    beforeEach(() => { tcs.testMode.saveResponses = true; });

    function startCalculator(state?: string) {
      fixture.componentInstance.widgets.openCalculator({ trigger, parameters: [], state });
      fixture.detectChanges();
      http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
      const widget = ready();
      const command: unknown = widget.post.calls.mostRecent().args[0];
      if (command === null || typeof command !== 'object' ||
        !('sessionId' in command) || typeof command.sessionId !== 'string') throw new Error('Missing session');
      const { sessionId } = command;
      return {
        sessionId,
        send(data: Record<string, unknown>, source = widget.source): void {
          messages.next(new MessageEvent('message', { source, data: {
            type: 'vowStateChangedNotification', sessionId, timeStamp: '2026-10-20T10:00:00Z', ...data
          } }));
        }
      };
    }

    function expectLog(key: string, content: Record<string, unknown>, timeStamp: unknown = jasmine.any(Number)): void {
      const request = http.expectOne('/api/test/calculator-run/unit/MATH_01/log');
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual({
        originalUnitId: getTestData().Units.u1.id,
        logEntries: [{ key, content, timeStamp }]
      });
      request.flush(null);
    }

    it('logs opening, only the newest formula, and user closure without a widget return', fakeAsync(() => {
      const widget = startCalculator();
      expectLog('CALCULATOR_OPENED', { sessionId: widget.sessionId });
      widget.send({ state: JSON.stringify([
        { asLatex: '1+1=2', asImage: 'old image' }, { asLatex: '9=9', asImage: 'data:image/png;base64,large' }
      ]) });
      expectLog('CALCULATOR_STATE_CHANGED', {
        sessionId: widget.sessionId, asLatex: '9=9'
      }, Date.parse('2026-10-20T10:00:00Z'));
      cancel();
      expectLog('CALCULATOR_CLOSED', { sessionId: widget.sessionId, reason: 'user_called', returnReceived: false });
      widget.send({ state: '[{"asLatex":"late"}]' });
      http.expectNone(request => request.url.endsWith('/log'));
    }));

    it('logs a widget return once without treating restored or final state as a new result', fakeAsync(() => {
      const widget = startCalculator('[{"asLatex":"restored"}]');
      expectLog('CALCULATOR_OPENED', { sessionId: widget.sessionId });
      widget.send({ type: 'vowReturnRequested', state: '[{"asLatex":"final"}]', saveState: false });
      widget.send({ type: 'vowReturnRequested' });
      tick();
      expectLog('CALCULATOR_CLOSED', { sessionId: widget.sessionId, reason: 'widget_return', returnReceived: true });
      http.expectNone(request => request.url.endsWith('/log'));
    }));

    it('rejects untrusted, stale and malformed updates and never falls back to an older journal entry', fakeAsync(() => {
      spyOn(console, 'warn');
      const widget = startCalculator();
      expectLog('CALCULATOR_OPENED', { sessionId: widget.sessionId });
      widget.send({ state: '[{"asLatex":"accepted"}]' });
      expectLog('CALCULATOR_STATE_CHANGED', {
        sessionId: widget.sessionId, asLatex: 'accepted'
      });
      widget.send({ state: '[{"asLatex":"wrong source"}]' }, window);
      widget.send({ sessionId: 'wrong', state: '[{"asLatex":"wrong session"}]' });
      widget.send({ timeStamp: 'invalid', state: '[{"asLatex":"invalid timestamp"}]' });
      widget.send({ timeStamp: '2026-10-20T09:59:59Z', state: '[{"asLatex":"stale"}]' });
      for (const state of ['invalid', '{}', '[]', '[null]', '[{"asLatex":"old"},{}]']) {
        widget.send({ state });
      }
      widget.send({ sharedParameters: [] });
      http.expectNone(request => request.url.endsWith('/log'));
      cancel();
      expectLog('CALCULATOR_CLOSED', { sessionId: widget.sessionId, reason: 'user_called', returnReceived: false });
    }));

    for (const scenario of ['unit_change', 'pause', 'run_reset', 'close_all'] as const) {
      it(`logs host closure against the opening unit and test for ${scenario}`, fakeAsync(() => {
        const widget = startCalculator();
        expectLog('CALCULATOR_OPENED', { sessionId: widget.sessionId });
        if (scenario === 'unit_change') {
          Object.assign(tcs, { currentUnit: getTestData().Units.u2, testId: 'other-run' });
          tcs.currentUnitSequenceId$.next(2);
        } else if (scenario === 'pause') {
          tcs.state$.next('PAUSED');
        } else if (scenario === 'run_reset') {
          reset.next();
        } else {
          dialog.closeAll();
        }
        tick();
        expectLog('CALCULATOR_CLOSED', {
          sessionId: widget.sessionId, reason: 'host_triggered', returnReceived: false
        });
        expect(dialog.openDialogs.length).toBe(0);
      }));
    }

    it('logs CALC requests from a player using the calculator events', fakeAsync(() => {
      const player = document.createElement('iframe');
      trigger.parentElement?.appendChild(player);
      const source = player.contentWindow;
      if (!source) throw new Error('Missing player window');
      fixture.componentInstance.widgets.open({
        call: { type: 'vopWidgetCall', sessionId: 'player-session', widgetType: 'CALC' },
        source, playerIframe: player
      });
      fixture.detectChanges();
      http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html').flush('<html></html>');
      const widget = ready();
      const command: unknown = widget.post.calls.mostRecent().args[0];
      if (command === null || typeof command !== 'object' || !('sessionId' in command)) throw new Error('Missing session');
      expectLog('CALCULATOR_OPENED', { sessionId: command.sessionId });
      cancel();
      expectLog('CALCULATOR_CLOSED', { sessionId: command.sessionId, reason: 'user_called', returnReceived: false });
      player.remove();
    }));

    it('does not log when response saving is disabled or no unit is active', fakeAsync(() => {
      tcs.testMode.saveResponses = false;
      startCalculator().send({ state: '[{"asLatex":"not saved"}]' });
      cancel();
      tcs.testMode.saveResponses = true;
      Object.assign(tcs, { currentUnit: null });
      startCalculator().send({ state: '[{"asLatex":"no unit"}]' });
      cancel();
      http.expectNone(request => request.url.endsWith('/log'));
    }));

    it('does not log an opening or closure if the calculator never starts', fakeAsync(() => {
      spyOn(console, 'error');
      open();
      http.expectOne('/api/file/calculator-group/ws_1/Resource/calculator.html')
        .flush('missing', { status: 404, statusText: 'Not found' });
      tick();
      cancel();
      http.expectNone(request => request.url.endsWith('/log'));
    }));
  });
});
