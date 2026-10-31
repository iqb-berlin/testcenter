import { fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { WidgetSession } from './widget-session.class';

describe('WidgetSession lifecycle', () => {
  let iframe: HTMLIFrameElement;
  let widgetWindow: Window;
  let messages: Subject<MessageEvent>;
  let session: WidgetSession;
  let ready: jasmine.Spy;
  let failed: jasmine.Spy;
  let returned: jasmine.Spy;
  let start: jasmine.Spy;
  let state: jasmine.Spy;
  let shared: jasmine.Spy;

  beforeEach(() => {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const source = iframe.contentWindow;
    if (!source) throw new Error('Missing widget window');
    widgetWindow = source;
    messages = new Subject<MessageEvent>();
    state = jasmine.createSpy('state');
    shared = jasmine.createSpy('shared');
    ready = jasmine.createSpy('ready');
    failed = jasmine.createSpy('failed');
    returned = jasmine.createSpy('returned');
    start = spyOn(widgetWindow, 'postMessage');
  });

  afterEach(() => {
    session.close();
    iframe.remove();
  });

  function createSession(): void {
    session = new WidgetSession({
      model: 'PERIODIC_TABLE',
      parameters: [],
      window: widgetWindow,
      messages,
      state: undefined,
      sharedParameters: [],
      onReady: ready,
      onState: state,
      onSharedParameters: shared,
      onReturn: returned,
      onError: failed
    });
  }

  function sendReady(): void {
    messages.next(new MessageEvent('message', {
      source: widgetWindow,
      data: {
        type: 'vowReadyNotification',
        metadata: JSON.stringify({
          type: 'WIDGET', model: 'PERIODIC_TABLE', id: 'periodic-table', version: '1.0.0',
          specVersion: '1.0', metadataVersion: '3.1', name: [{ lang: 'de', value: 'Periodensystem' }]
        })
      }
    }));
  }

  it('cancels its timeout and ignores messages after repeated close calls', fakeAsync(() => {
    createSession();
    session.close();
    session.close();
    sendReady();
    tick(15000);
    expect(start).not.toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
    expect(failed).not.toHaveBeenCalled();
  }));

  it('reports a timeout once and rejects a late handshake', fakeAsync(() => {
    createSession();
    tick(15000);
    expect(failed).toHaveBeenCalledOnceWith(jasmine.any(Error));
    sendReady();
    tick(15000);
    expect(failed).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
  }));

  it('finishes on return and ignores repeated return and ready messages', fakeAsync(() => {
    createSession();
    sendReady();
    const command: unknown = start.calls.mostRecent().args[0];
    if (command === null || typeof command !== 'object' || !('sessionId' in command)) {
      throw new Error('Missing widget start command');
    }
    const event = new MessageEvent('message', {
      source: widgetWindow,
      data: { type: 'vowReturnRequested', sessionId: command.sessionId, timeStamp: '2026-10-15T12:00:00Z', state: '' }
    });
    messages.next(event);
    messages.next(event);
    sendReady();
    tick(15000);
    expect(returned).toHaveBeenCalledOnceWith('', true);
    expect(start).toHaveBeenCalledTimes(1);
    expect(failed).not.toHaveBeenCalled();
  }));
  it('accepts only trusted, valid updates in timestamp order, including empty shared values', fakeAsync(() => {
    spyOn(console, 'warn');
    createSession();
    sendReady();
    const command = start.calls.mostRecent().args[0] as { sessionId: string };
    const data = { type: 'vowStateChangedNotification', sessionId: command.sessionId,
      timeStamp: '2026-10-15T12:00:02Z', state: 'accepted', sharedParameters: [{ key: 'shared', value: '' }] };
    for (const invalid of [
      { sessionId: 'wrong' }, { timeStamp: 'invalid' }, { timeStamp: '2026-02-30T12:00:00Z' },
      { sharedParameters: [{ key: 'valid', value: 'yes' }, { key: 'invalid' }] }
    ]) messages.next(new MessageEvent('message', { source: widgetWindow, data: { ...data, ...invalid } }));
    messages.next(new MessageEvent('message', { source: window, data }));
    expect(state).not.toHaveBeenCalled();
    expect(shared).not.toHaveBeenCalled();
    messages.next(new MessageEvent('message', { source: widgetWindow, data }));
    messages.next(new MessageEvent('message', { source: widgetWindow,
      data: { ...data, timeStamp: '2026-10-15T12:00:01Z', state: 'stale' } }));
    expect(state).toHaveBeenCalledOnceWith('accepted');
    expect(shared).toHaveBeenCalledOnceWith([{ key: 'shared', value: '' }]);
    messages.next(new MessageEvent('message', { source: widgetWindow,
      data: { ...data, type: 'vowReturnRequested', timeStamp: '2026-10-15T12:00:01Z', state: 'stale final' } }));
    expect(returned).toHaveBeenCalledOnceWith('accepted', true);
  }));

  it('honors saveState false and preserves an empty accepted state when final state is absent', fakeAsync(() => {
    for (const saveState of [true, false]) {
      createSession();
      sendReady();
      const { sessionId } = start.calls.mostRecent().args[0] as { sessionId: string };
      messages.next(new MessageEvent('message', { source: widgetWindow, data: {
        type: 'vowStateChangedNotification', sessionId, timeStamp: '2026-10-15T12:00:00Z', state: ''
      } }));
      messages.next(new MessageEvent('message', { source: widgetWindow, data: {
        type: 'vowReturnRequested', sessionId, timeStamp: '2026-10-15T12:00:01Z', saveState
      } }));
      expect(returned).toHaveBeenCalledWith('', saveState);
    }
  }));
});
