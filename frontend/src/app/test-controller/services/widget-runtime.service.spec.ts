import {
  fakeAsync, flush, TestBed, tick
} from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import {
  BehaviorSubject, of, Subject, throwError
} from 'rxjs';
import { MainDataService } from '@shared/shared.module';
import { TestControllerService } from './test-controller.service';
import { WidgetRequest, WidgetRuntimeService } from './widget-runtime.service';
import { TestControllerState } from '../interfaces/test-controller.interfaces';
import { VowStartCommand } from '../interfaces/widget.interfaces';

describe('WidgetRuntimeService', () => {
  let service: WidgetRuntimeService;
  let messages: Subject<MessageEvent>;
  let authData: BehaviorSubject<object | null>;
  let tcs: {
    currentUnitSequenceId$: BehaviorSubject<number>;
    state$: BehaviorSubject<TestControllerState>;
    sharedParameters: { key: string; value: string }[];
    addSharedParameters: jasmine.Spy;
  };

  beforeEach(() => {
    messages = new Subject<MessageEvent>();
    authData = new BehaviorSubject<object | null>({});
    tcs = {
      currentUnitSequenceId$: new BehaviorSubject(1),
      state$: new BehaviorSubject<TestControllerState>('RUNNING'),
      sharedParameters: [{ key: 'SHARED', value: 'yes' }],
      addSharedParameters: jasmine.createSpy('addSharedParameters')
    };
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        WidgetRuntimeService,
        { provide: TestControllerService, useValue: tcs },
        { provide: MainDataService, useValue: { postMessage$: messages, authData$: authData } }
      ]
    });
    service = TestBed.inject(WidgetRuntimeService);
  });

  // fakeAsync runs the remaining timers at the end of each test, so tests close open widgets themselves before the
  // widget's ready timeout would fail them
  afterEach(fakeAsync(() => {
    service.ngOnDestroy();
    flush();
  }));

  // Lets the window open or close, staying below the widget's ready timeout.
  function settle(): void {
    tick(1000);
  }

  function createRequest(request: Partial<WidgetRequest> = {}): WidgetRequest {
    return {
      title: 'Periodensystem',
      html: of('<html></html>'),
      parameters: [{ key: 'MAX_NUMBER_OF_SELECTIONS', value: '1' }],
      losesWorkOnClose: true,
      ...request
    };
  }

  function findWindows(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('.widget-window'));
  }

  function findWidgetWindow(): Window {
    const iframe = document.querySelector<HTMLIFrameElement>('.widget-window iframe');
    if (!iframe?.contentWindow) throw new Error('No widget window');
    return iframe.contentWindow;
  }

  // Lets the widget report ready and returns the start command it got.
  function startWidget(): VowStartCommand {
    const widgetWindow = findWidgetWindow();
    const postMessage = spyOn(widgetWindow, 'postMessage');
    messages.next(new MessageEvent('message', { source: widgetWindow, data: { type: 'vowReadyNotification' } }));
    return postMessage.calls.mostRecent().args[0] as VowStartCommand;
  }

  function receive(data: object): void {
    messages.next(new MessageEvent('message', { source: findWidgetWindow(), data }));
  }

  it('opens the widget in a window that leaves the unit usable', fakeAsync(() => {
    expect(service.open(createRequest())).toBeTrue();
    settle();

    expect(findWindows().length).toBe(1);
    expect(document.querySelector('.widget-window h2')?.textContent?.trim()).toBe('Periodensystem');
    expect(document.querySelector('.cdk-overlay-backdrop')).toBeNull();
    service.close();
  }));

  it('starts the widget with its parameters, the state and the shared parameters', fakeAsync(() => {
    service.open(createRequest({ state: 'H' }));
    settle();

    expect(startWidget()).toEqual(jasmine.objectContaining({
      parameters: [{ key: 'MAX_NUMBER_OF_SELECTIONS', value: '1' }],
      sharedParameters: [{ key: 'SHARED', value: 'yes' }],
      state: 'H'
    }));
  }));

  it('passes state changes on and collects shared parameters', fakeAsync(() => {
    const onStateChanged = jasmine.createSpy('onStateChanged');
    service.open(createRequest({ onStateChanged }));
    settle();
    const { sessionId } = startWidget();
    receive({
      type: 'vowStateChangedNotification',
      sessionId,
      timeStamp: '2026-11-06T12:00:00Z',
      state: 'He',
      sharedParameters: [{ key: 'SHARED', value: 'no' }]
    });

    expect(onStateChanged).toHaveBeenCalledOnceWith('He');
    expect(tcs.addSharedParameters).toHaveBeenCalledOnceWith([{ key: 'SHARED', value: 'no' }]);
  }));

  it('closes the window on return', fakeAsync(() => {
    const onReturn = jasmine.createSpy('onReturn');
    service.open(createRequest({ onReturn }));
    settle();
    const { sessionId } = startWidget();
    receive({ type: 'vowReturnRequested', sessionId, timeStamp: '2026-11-06T12:00:00Z', state: 'Li' });
    settle();

    expect(onReturn).toHaveBeenCalledOnceWith('Li', true);
    expect(findWindows().length).toBe(0);
  }));

  it('shows an error when the widget could not be loaded', fakeAsync(() => {
    spyOn(console, 'error');
    service.open(createRequest({ html: throwError(() => new Error('404')) }));
    settle();

    expect(document.querySelector('.widget-window .status')?.textContent).toContain('Fehler');
    expect(console.error).toHaveBeenCalled();
  }));

  it('shows an error instead of the widget when it sends an invalid message', fakeAsync(() => {
    spyOn(console, 'error');
    const onReturn = jasmine.createSpy('onReturn');
    service.open(createRequest({ onReturn }));
    settle();
    const { sessionId } = startWidget();
    receive({ type: 'vowReturnRequested', sessionId, timeStamp: 'now' });
    settle();

    expect(findWindows().length).toBe(1);
    expect(document.querySelector('.widget-window iframe')).toBeNull();
    expect(document.querySelector('.widget-window .status')?.textContent).toContain('Fehler');
    expect(onReturn).not.toHaveBeenCalled();
    // the failed widget no longer blocks other requests, although it would have lost work
    expect(service.open(createRequest({ title: 'Molekül-Editor' }))).toBeTrue();
    settle();
    expect(findWindows().length).toBe(1);
    service.close();
  }));

  it('shows that a widget is unavailable until the next request replaces it', fakeAsync(() => {
    service.showUnavailable('Periodensystem');
    settle();
    expect(document.querySelector('.widget-window h2')?.textContent?.trim()).toBe('Periodensystem');
    expect(document.querySelector('.widget-window .status')?.textContent).toContain('nicht verfügbar');

    expect(service.open(createRequest({ title: 'Molekül-Editor' }))).toBeTrue();
    settle();
    expect(findWindows().length).toBe(1);
    expect(document.querySelector('.widget-window h2')?.textContent?.trim()).toBe('Molekül-Editor');
    service.close();
  }));

  it('does not show that a widget is unavailable over a widget that would lose work', fakeAsync(() => {
    service.open(createRequest({ title: 'Periodensystem', losesWorkOnClose: true }));
    settle();

    service.showUnavailable('Molekül-Editor');
    settle();
    expect(findWindows().length).toBe(1);
    expect(document.querySelector('.widget-window h2')?.textContent?.trim()).toBe('Periodensystem');
    service.close();
  }));

  [
    { situation: 'the unit changes', change: () => tcs.currentUnitSequenceId$.next(2) },
    { situation: 'the test is paused', change: () => tcs.state$.next('PAUSED') },
    { situation: 'the test taker is logged out', change: () => authData.next(null) }
  ].forEach(({ situation, change }) => {
    it(`closes the widget when ${situation}`, fakeAsync(() => {
      const onReturn = jasmine.createSpy('onReturn');
      service.open(createRequest({ onReturn }));
      settle();
      change();
      settle();

      expect(findWindows().length).toBe(0);
      expect(onReturn).not.toHaveBeenCalled();
    }));
  });

  it('ignores a request while a widget that would lose work is open', fakeAsync(() => {
    service.open(createRequest({ title: 'Periodensystem', losesWorkOnClose: true }));
    settle();

    expect(service.open(createRequest({ title: 'Molekül-Editor' }))).toBeFalse();
    settle();
    expect(findWindows().length).toBe(1);
    expect(document.querySelector('.widget-window h2')?.textContent?.trim()).toBe('Periodensystem');
    expect(document.activeElement?.closest('.widget-window')).not.toBeNull();
    service.close();
  }));

  it('reports the closing once when the Testcenter closes the window', fakeAsync(() => {
    const onClosed = jasmine.createSpy('onClosed');
    service.open(createRequest({ onClosed, losesWorkOnClose: false }));
    settle();
    tcs.currentUnitSequenceId$.next(2);
    settle();

    expect(onClosed).toHaveBeenCalledTimes(1);
  }));

  it('only focuses the open widget when it is requested again', fakeAsync(() => {
    const html = new Subject<string>();
    service.open(createRequest({ id: 'calculator', losesWorkOnClose: false, html }));
    settle();
    const window = findWindows()[0];

    expect(service.open(createRequest({ id: 'calculator', losesWorkOnClose: false }))).toBeFalse();
    settle();
    expect(findWindows()).toEqual([window]);
    expect(document.activeElement?.closest('.widget-window')).not.toBeNull();
    service.close();
  }));

  it('replaces a widget that failed, also with a new request for it', fakeAsync(() => {
    spyOn(console, 'error');
    service.open(createRequest({ id: 'calculator', html: throwError(() => new Error('404')) }));
    settle();

    expect(service.open(createRequest({ id: 'calculator', title: 'Taschenrechner' }))).toBeTrue();
    settle();
    expect(findWindows().length).toBe(1);
    expect(document.querySelector('.widget-window h2')?.textContent?.trim()).toBe('Taschenrechner');
    service.close();
  }));

  it('replaces a widget that loses nothing', fakeAsync(() => {
    service.open(createRequest({ title: 'Taschenrechner', losesWorkOnClose: false }));
    settle();

    expect(service.open(createRequest({ title: 'Periodensystem' }))).toBeTrue();
    settle();
    expect(findWindows().length).toBe(1);
    expect(document.querySelector('.widget-window h2')?.textContent?.trim()).toBe('Periodensystem');
    service.close();
  }));

  it('closes the widget when the test is left', fakeAsync(() => {
    service.open(createRequest());
    settle();
    service.ngOnDestroy();
    settle();

    expect(findWindows().length).toBe(0);
  }));
});
