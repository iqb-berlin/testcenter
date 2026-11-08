import { fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { WidgetSession, WidgetSessionOptions } from './widget-session.class';
import { VowStartCommand } from '../interfaces/widget.interfaces';

describe('WidgetSession', () => {
  let iframe: HTMLIFrameElement;
  let widgetWindow: Window;
  let messages: Subject<MessageEvent>;
  let postMessage: jasmine.Spy;
  let onReady: jasmine.Spy;
  let onStateChanged: jasmine.Spy;
  let onReturn: jasmine.Spy;
  let onError: jasmine.Spy;
  let session: WidgetSession;

  beforeEach(() => {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    widgetWindow = iframe.contentWindow as Window;
    messages = new Subject<MessageEvent>();
    postMessage = spyOn(widgetWindow, 'postMessage');
    onReady = jasmine.createSpy('onReady');
    onStateChanged = jasmine.createSpy('onStateChanged');
    onReturn = jasmine.createSpy('onReturn');
    onError = jasmine.createSpy('onError');
    spyOn(console, 'warn');
  });

  afterEach(() => {
    session.close();
    iframe.remove();
  });

  function createSession(options: Partial<WidgetSessionOptions> = {}): void {
    session = new WidgetSession({
      window: widgetWindow,
      messages,
      parameters: [{ key: 'BONDING_TYPE', value: 'VALENCE' }],
      sharedParameters: [{ key: 'SHARED', value: 'yes' }],
      onReady,
      onStateChanged,
      onReturn,
      onError,
      ...options
    });
  }

  function receive(data: unknown, source: Window = widgetWindow): void {
    messages.next(new MessageEvent('message', { source, data }));
  }

  function receiveReady(): void {
    receive({ type: 'vowReadyNotification', metadata: '{}' });
  }

  function getStartCommand(): VowStartCommand {
    return postMessage.calls.mostRecent().args[0] as VowStartCommand;
  }

  function receiveUpdate(type: string, data: object = {}): void {
    receive({ type, sessionId: getStartCommand().sessionId, timeStamp: '2026-11-06T12:00:00.000Z', ...data });
  }

  it('sends the start command when the widget is ready', () => {
    createSession({ state: 'H He' });
    receiveReady();

    expect(postMessage).toHaveBeenCalledOnceWith({
      type: 'vowStartCommand',
      sessionId: jasmine.stringMatching(/^[0-9]+$/),
      parameters: [{ key: 'BONDING_TYPE', value: 'VALENCE' }],
      sharedParameters: [{ key: 'SHARED', value: 'yes' }],
      state: 'H He'
    }, '*');
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('leaves the state out of the start command when there is none', () => {
    createSession();
    receiveReady();

    expect('state' in getStartCommand()).toBeFalse();
  });

  it('uses a new session id for every session', () => {
    createSession();
    receiveReady();
    const firstSessionId = getStartCommand().sessionId;
    session.close();
    createSession();
    receiveReady();

    expect(getStartCommand().sessionId).not.toEqual(firstSessionId);
  });

  it('starts only once', () => {
    createSession();
    receiveReady();
    receiveReady();

    expect(postMessage).toHaveBeenCalledTimes(1);
  });

  it('ignores messages from other windows', () => {
    createSession();
    receive({ type: 'vowReadyNotification', metadata: '{}' }, window);

    expect(postMessage).not.toHaveBeenCalled();
  });

  it('fails when the widget does not report ready in time', fakeAsync(() => {
    createSession();
    tick(15000);
    receiveReady();

    expect(onError).toHaveBeenCalledOnceWith(jasmine.any(Error));
    expect(postMessage).not.toHaveBeenCalled();
  }));

  it('does not time out once the widget is ready', fakeAsync(() => {
    createSession();
    receiveReady();
    tick(15000);

    expect(onError).not.toHaveBeenCalled();
  }));

  it('ignores everything after close', fakeAsync(() => {
    createSession();
    session.close();
    receiveReady();
    tick(15000);

    expect(postMessage).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  }));

  it('reports state changes and shared parameters', () => {
    createSession();
    receiveReady();
    receiveUpdate('vowStateChangedNotification', { state: 'H' });
    receiveUpdate('vowStateChangedNotification', { sharedParameters: [{ key: 'SHARED', value: '' }] });

    expect(onStateChanged.calls.allArgs()).toEqual([
      ['H', undefined],
      [undefined, [{ key: 'SHARED', value: '' }]]
    ]);
  });

  it('ignores state changes before the start', () => {
    createSession();
    receive({ type: 'vowStateChangedNotification', sessionId: 'any', timeStamp: '2026-11-06T12:00:00Z', state: 'H' });

    expect(onStateChanged).not.toHaveBeenCalled();
  });

  it('rejects invalid messages and messages for another session', () => {
    createSession();
    receiveReady();
    [
      { sessionId: 'another session' },
      { sessionId: '' },
      { timeStamp: 'yesterday' },
      { timeStamp: undefined },
      { state: 42 },
      { sharedParameters: [{ key: 'SHARED' }] },
      { sharedParameters: 'SHARED' }
    ].forEach(invalid => receiveUpdate('vowStateChangedNotification', { state: 'H', ...invalid }));

    expect(onStateChanged).not.toHaveBeenCalled();
  });

  it('ignores a state that is older than the latest one', () => {
    createSession();
    receiveReady();
    receiveUpdate('vowStateChangedNotification', { state: 'He', timeStamp: '2026-11-06T12:00:02Z' });
    receiveUpdate('vowStateChangedNotification', { state: 'H', timeStamp: '2026-11-06T12:00:01Z' });

    expect(onStateChanged).toHaveBeenCalledOnceWith('He', undefined);
  });

  it('returns the state from the return message', () => {
    createSession();
    receiveReady();
    receiveUpdate('vowStateChangedNotification', { state: 'H' });
    receiveUpdate('vowReturnRequested', { state: 'He', saveState: true });

    expect(onStateChanged).toHaveBeenCalledWith('He', undefined);
    expect(onReturn).toHaveBeenCalledOnceWith('He', true);
  });

  it('returns the latest state when the return message has none', () => {
    createSession({ state: 'Li' });
    receiveReady();
    receiveUpdate('vowReturnRequested');

    expect(onReturn).toHaveBeenCalledOnceWith('Li', true);
  });

  it('returns the latest state when the return message is older', () => {
    createSession();
    receiveReady();
    receiveUpdate('vowStateChangedNotification', { state: 'He', timeStamp: '2026-11-06T12:00:02Z' });
    receiveUpdate('vowReturnRequested', { state: 'H', timeStamp: '2026-11-06T12:00:01Z' });

    expect(onReturn).toHaveBeenCalledOnceWith('He', true);
  });

  it('passes saveState false on', () => {
    createSession();
    receiveReady();
    receiveUpdate('vowReturnRequested', { saveState: false });

    expect(onReturn).toHaveBeenCalledOnceWith(undefined, false);
  });

  it('ends with the return', () => {
    createSession();
    receiveReady();
    receiveUpdate('vowReturnRequested');
    receiveUpdate('vowReturnRequested');
    receiveUpdate('vowStateChangedNotification', { state: 'H' });

    expect(onReturn).toHaveBeenCalledTimes(1);
    expect(onStateChanged).not.toHaveBeenCalled();
  });
});
