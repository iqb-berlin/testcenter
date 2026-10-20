import { TestControllerModule } from '../../test-controller.module';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  CustomtextService, ConnectionStatus, MainDataService, TestMode, BackendService as SharedBackendService
} from '../../../shared/shared.module';
import { AppError } from '../../../app.interfaces';
import { BackendService } from '../../services/backend.service';
import { CommandService } from '../../services/command.service';
import { TestControllerService } from '../../services/test-controller.service';
import { TestLoaderService } from '../../services/test-loader.service';
import { TestControllerComponent } from './test-controller.component';
import {
  Booklet, Command, TestControllerState, TestData, Testlet, Unit, WindowFocusState
} from '../../interfaces/test-controller.interfaces';
import { TimerData } from '../../classes/test-controller.classes';
import { WidgetService } from '../../services/widget.service';

function createController() {
  const data: { booklet: Booklet | null; units: Record<number, Unit>; widgets: TestData['widgets'] } = {
    booklet: null, units: {}, widgets: { CALCULATOR: ['Resource/calculator.html'] }
  };
  return {
    ...data, workspaceId: 1, currentUnitSequenceId: 1, totalLoadingProgress: 0,
    get currentUnit(): Unit | null { return this.units[this.currentUnitSequenceId] || null; },
    currentUnitSequenceId$: new Subject<number>(), runReset$: new Subject<void>(),
    state$: new BehaviorSubject<TestControllerState>('RUNNING'), unitContentReady$: new BehaviorSubject(true),
    timers$: new Subject<TimerData>(), navigation$: new Subject(),
    windowFocusState$: new BehaviorSubject<WindowFocusState>('HOST'),
    testMode: new TestMode(), sharedParameters: [],
    addSharedParameters: jasmine.createSpy('addSharedParameters'),
    addToTestStateBuffer: jasmine.createSpy('addToTestStateBuffer'),
    setUnitNavigationRequest: jasmine.createSpy('setUnitNavigationRequest'),
    getWidgetResourcePath(model: string): string | undefined {
      return TestControllerService.prototype.getWidgetResourcePath.call(this, model);
    }
  };
}

const journal = '[{"asLatex":"1+1=2","asImage":""}]';
const resultImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwC' +
  'AAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';
const metadata = JSON.stringify({
  type: 'WIDGET', model: 'CALCULATOR', id: 'calculator', version: '1.0.0',
  specVersion: '1.0', metadataVersion: '3.1', name: [{ lang: 'de', value: 'Rechner' }]
});

describe('TestControllerComponent calculator header', () => {
  let fixture: ComponentFixture<TestControllerComponent>;
  let component: TestControllerComponent;
  let controller: ReturnType<typeof createController>;
  let messages: Subject<MessageEvent>;
  let http: HttpTestingController;
  let dialog: MatDialog;
  let authData: Subject<void>;

  beforeEach(fakeAsync(() => {
    controller = createController();
    messages = new Subject<MessageEvent>();
    authData = new Subject<void>();
    TestBed.configureTestingModule({
      imports: [TestControllerModule, MatIconTestingModule, NoopAnimationsModule, RouterTestingModule],
      providers: [
        CustomtextService, BackendService,
        { provide: TestControllerService, useValue: controller },
        { provide: CommandService, useValue: {
          command$: new Subject<Command>(), connectionStatus$: new Subject<ConnectionStatus>()
        } },
        { provide: MainDataService, useValue: {
          appError$: new Subject<AppError>(), appWindowHasFocus$: new Subject<boolean>(),
          authData$: authData, postMessage$: messages, appConfig: { fileServiceUri: '' },
          clearErrorBuffer: () => {},
          getAuthData: () => ({ displayName: 'testAccountName', groupToken: 'header-group' })
        } },
        { provide: ActivatedRoute, useValue: { params: new Subject<Params>() } },
        { provide: SharedBackendService, useValue: {} },
        { provide: 'IS_PRODUCTION_MODE', useValue: true },
        { provide: 'FILE_SERVER_URL', useValue: '/files/' },
        { provide: 'BACKEND_URL', useValue: '/api/' },
        provideHttpClient(), provideHttpClientTesting()
      ]
    });
    controller.booklet = TestBed.inject(TestLoaderService).parseBookletXml(`<Booklet>
      <Metadata><Id>header-test</Id><Label>Header test</Label></Metadata><Units>
        <Testlet id="configured">
          <Calculator show="yes" mode="SCIENTIFIC" journalLines="5" maxImageWidthPx="333">
            <Journal>${journal}</Journal>
          </Calculator>
          <Unit id="u1" label="Configured"/>
          <Testlet id="inherits"><Unit id="u2" label="Inherited"/></Testlet>
          <Testlet id="hidden"><Calculator show="no"/><Unit id="u3" label="Hidden"/></Testlet>
          <Testlet id="overrides"><Calculator show="yes"/><Unit id="u4" label="Defaults"/></Testlet>
        </Testlet>
        <Testlet id="absent"><Unit id="u5" label="No calculator"/></Testlet>
      </Units></Booklet>`);
    const collect = (testlet: Testlet): void => {
      for (const child of testlet.children) {
        if ('sequenceId' in child) controller.units[child.sequenceId] = child;
        else collect(child);
      }
    };
    collect(controller.booklet.units);
    fixture = TestBed.createComponent(TestControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    controller.currentUnitSequenceId$.next(1);
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);
  }));

  afterEach(() => {
    fixture.destroy();
    controller.currentUnitSequenceId$.complete();
    controller.navigation$.complete();
    dialog.closeAll();
    http.verify();
  });

  function host(): HTMLElement {
    const element: unknown = fixture.nativeElement;
    if (!(element instanceof HTMLElement)) throw new Error('Missing controller host');
    return element;
  }

  function button(): HTMLButtonElement {
    const element = host().querySelector<HTMLButtonElement>('[data-cy="calculator"]');
    if (!element) throw new Error('Missing calculator button');
    return element;
  }

  function selectUnit(sequenceId: number): void {
    controller.currentUnitSequenceId = sequenceId;
    controller.currentUnitSequenceId$.next(sequenceId);
    fixture.detectChanges();
  }

  function start(model = 'CALCULATOR') {
    const trigger = button();
    trigger.click();
    fixture.detectChanges();
    http.expectOne('/api/file/header-group/ws_1/Resource/calculator.html').flush('<html></html>');
    tick();
    const source = document.querySelector<HTMLIFrameElement>('[role="dialog"] iframe')?.contentWindow;
    if (!source) throw new Error('Missing calculator window');
    const post = spyOn(source, 'postMessage');
    messages.next(new MessageEvent('message', { source, data: {
      type: 'vowReadyNotification', metadata: JSON.stringify({ ...JSON.parse(metadata), model })
    } }));
    const command: unknown = post.calls.mostRecent().args[0];
    return { source, post, command, trigger };
  }

  function close(): void {
    document.querySelector<HTMLButtonElement>('[aria-label="Widget schließen"]')?.click();
    tick();
  }

  function element<T extends HTMLElement>(selector: string): T {
    const found = host().querySelector<T>(selector);
    if (!found) throw new Error(`Missing ${selector}`);
    return found;
  }

  function sendState(widget: ReturnType<typeof start>, state: string,
                     type = 'vowReturnRequested', timeStamp = '2026-10-16T12:00:00Z'): void {
    if (widget.command === null || typeof widget.command !== 'object' || !('sessionId' in widget.command)) {
      throw new Error('Missing widget session');
    }
    messages.next(new MessageEvent('message', { source: widget.source, data: {
      type, sessionId: widget.command.sessionId, timeStamp, state
    } }));
    tick();
    fixture.detectChanges();
  }

  function returnResult(formula = '1+2=3'): void {
    sendState(start(), JSON.stringify([{ asLatex: formula, asImage: resultImage }]));
  }

  it('shows the final journal image after return without opening another modal or taking focus', fakeAsync(() => {
    returnResult();
    expect(dialog.openDialogs.length).toBe(0);
    const image = element<HTMLImageElement>('[data-cy="calculator-peek"] img');
    expect(image.src).toBe(resultImage);
    expect(image.alt).toBe('1+2=3');
    expect(element('[data-cy="calculator-peek"]').hidden).toBeFalse();
    expect(document.activeElement).toBe(button());
    expect(document.querySelector('.cdk-overlay-backdrop')).toBeNull();
    expect(getComputedStyle(element('tc-calculator-peek')).pointerEvents).toBe('none');
    expect(getComputedStyle(element('[data-cy="calculator-peek"]')).pointerEvents).toBe('auto');
    // The underlying header remains usable while the peek is expanded.
    start();
    close();
  }));

  it('closes the result entirely without leaving a taskbar button', fakeAsync(() => {
    returnResult();
    element<HTMLButtonElement>('[aria-label="Ergebnisfenster schließen"]').click();
    fixture.detectChanges();
    expect(host().querySelector('tc-calculator-peek')).toBeNull();
    expect(host().querySelector('[data-cy="calculator-peek-taskbar"]')).toBeNull();
    expect(fixture.debugElement.injector.get(WidgetService).calculatorResult()).toBeUndefined();
    selectUnit(2);
    expect(host().querySelector('tc-calculator-peek')).toBeNull();
    sendState(start(), '[{"asLatex":"no image","asImage":null}]');
    expect(host().querySelector('tc-calculator-peek')).toBeNull();
  }));

  it('shows a new peek with the newest result after closing the previous one', fakeAsync(() => {
    returnResult();
    element<HTMLButtonElement>('[aria-label="Ergebnisfenster schließen"]').click();
    const widget = start();
    sendState(widget, JSON.stringify([
      { asLatex: '1+2=3', asImage: resultImage }, { asLatex: '4+5=9', asImage: resultImage }
    ]));
    expect(host().querySelectorAll('tc-calculator-peek').length).toBe(1);
    expect(element('[data-cy="calculator-peek"]').hidden).toBeFalse();
    expect(element<HTMLImageElement>('[data-cy="calculator-peek"] img').alt).toBe('4+5=9');
  }));

  it('uses accepted state on host close and ignores stale final state', fakeAsync(() => {
    const widget = start();
    sendState(widget, JSON.stringify([{ asLatex: 'accepted', asImage: resultImage }]),
              'vowStateChangedNotification', '2026-10-16T12:00:02Z');
    expect(host().querySelector('tc-calculator-peek')).toBeNull();
    close();
    fixture.detectChanges();
    expect(element<HTMLImageElement>('[data-cy="calculator-peek"] img').alt).toBe('accepted');
    const next = start();
    sendState(next, JSON.stringify([{ asLatex: 'newest', asImage: resultImage }]),
              'vowStateChangedNotification', '2026-10-16T12:00:03Z');
    sendState(next, JSON.stringify([{ asLatex: 'stale', asImage: resultImage }]));
    expect(element<HTMLImageElement>('[data-cy="calculator-peek"] img').alt).toBe('newest');
  }));

  it('closes the peek on unit navigation without restoring it on return', fakeAsync(() => {
    returnResult();
    selectUnit(2);
    expect(host().querySelector('tc-calculator-peek')).toBeNull();
    selectUnit(1);
    expect(host().querySelector('tc-calculator-peek')).toBeNull();
    returnResult();
    expect(element('[data-cy="calculator-peek"]').hidden).toBeFalse();
    selectUnit(3);
    expect(host().querySelector('tc-calculator-peek')).toBeNull();
    selectUnit(4);
    expect(host().querySelector('tc-calculator-peek')).toBeNull();
  }));

  it('hides the peek while paused or waiting for unit content', fakeAsync(() => {
    returnResult();
    const peek = element('tc-calculator-peek');
    controller.state$.next('PAUSED');
    fixture.detectChanges();
    expect(peek.hidden).toBeTrue();
    controller.state$.next('RUNNING');
    controller.unitContentReady$.next(false);
    fixture.detectChanges();
    expect(peek.hidden).toBeTrue();
    controller.unitContentReady$.next(true);
    fixture.detectChanges();
    expect(peek.hidden).toBeFalse();
  }));

  it('does not create a peek on a forced close and clears it on run reset', fakeAsync(() => {
    const widget = start();
    sendState(widget, JSON.stringify([{ asLatex: '1+2=3', asImage: resultImage }]),
              'vowStateChangedNotification');
    selectUnit(2);
    tick();
    fixture.detectChanges();
    expect(host().querySelector('tc-calculator-peek')).toBeNull();
    returnResult();
    controller.runReset$.next();
    fixture.detectChanges();
    expect(host().querySelector('tc-calculator-peek')).toBeNull();
    expect(fixture.debugElement.injector.get(WidgetService).calculatorResult()).toBeUndefined();
  }));

  it('moves by its title bar, stays in the viewport and remains recoverable after resizing', fakeAsync(() => {
    returnResult();
    const peek = element('[data-cy="calculator-peek"]');
    const handle = element('[data-cy="calculator-peek"] .handle');
    const initial = peek.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const x = handleRect.left + 10;
    const y = handleRect.top + 10;
    // A real mouse press has a click count. CDK ignores screen-reader presses with detail=0.
    handle.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true, buttons: 1, detail: 1, clientX: x, clientY: y
    }));
    document.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true, buttons: 1, clientX: x - 30, clientY: y + 30
    }));
    tick(20);
    document.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true, buttons: 1, clientX: x - 80, clientY: y + 80
    }));
    tick(20);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    tick();
    expect(peek.getBoundingClientRect().left).toBeLessThan(initial.left);
    expect(peek.getBoundingClientRect().top).toBeGreaterThan(initial.top);
    expect(peek.getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
    expect(peek.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    expect(peek.getBoundingClientRect().left).toBeCloseTo(initial.left, 0);
  }));

  it('retains an existing result when a later close has no usable image', fakeAsync(() => {
    returnResult();
    sendState(start(), '[{"asLatex":"no image","asImage":null}]');
    expect(element<HTMLImageElement>('[data-cy="calculator-peek"] img').alt).toBe('1+2=3');
  }));

  it('hides the previous peek during a modal and clears it on authentication change', fakeAsync(() => {
    returnResult();
    start();
    expect(element('tc-calculator-peek').hidden).toBeTrue();
    authData.next();
    tick();
    fixture.detectChanges();
    expect(dialog.openDialogs.length).toBe(0);
    expect(host().querySelector('tc-calculator-peek')).toBeNull();
  }));

  it('renders a directly accessible calculator button in the reload/fullscreen header', () => {
    expect(component).toBeTruthy();
    expect(button().closest('[data-cy="unit-screenheader"]')).not.toBeNull();
    expect(button().closest('mat-menu')).toBeNull();
    expect(button().getAttribute('aria-label')).toBe('Taschenrechner');
  });

  it('keeps the calculator available when reload and fullscreen are hidden', () => {
    controller.booklet?.config.setFromKeyValuePairs({
      toolbar_show_reload_button: 'FALSE', toolbar_show_fullscreen_button: 'FALSE'
    });
    fixture.detectChanges();
    expect(button()).toBeTruthy();
  });

  it('tracks inherited, disabled, overridden and absent configurations across units', () => {
    selectUnit(2);
    expect(button()).toBeTruthy();
    selectUnit(3);
    expect(host().querySelector('[data-cy="calculator"]')).toBeNull();
    selectUnit(4);
    expect(button()).toBeTruthy();
    selectUnit(5);
    expect(host().querySelector('[data-cy="calculator"]')).toBeNull();
  });

  it('passes all four authored parameters as strings through the real widget start command', fakeAsync(() => {
    expect(start().command).toEqual(jasmine.objectContaining({ parameters: [
      { key: 'MODE', value: 'SCIENTIFIC' }, { key: 'JOURNAL_LINES', value: '5' },
      { key: 'MAX_IMAGE_WIDTH_PX', value: '333' }, { key: 'JOURNAL', value: journal }
    ] }));
    close();
    selectUnit(4);
    expect(start().command).toEqual(jasmine.objectContaining({ parameters: [
      { key: 'MODE', value: 'SIMPLE' }, { key: 'JOURNAL_LINES', value: '0' },
      { key: 'MAX_IMAGE_WIDTH_PX', value: '200' }, { key: 'JOURNAL', value: '[]' }
    ] }));
    close();
  }));

  for (const model of ['CALCULATOR', 'CALC']) {
    for (const state of ['', '[{"asLatex":"2+2=4","asImage":""}]']) {
      it(`isolates and restores ${model} journals per unit, including state ${JSON.stringify(state)}`, fakeAsync(() => {
        controller.widgets = { [model]: ['Resource/calculator.html'] };
        // Repeated unit files still have distinct occurrences and journals.
        controller.units[2] = { ...controller.units[2], id: controller.units[1].id };
        const first = start(model);
        sendState(first, state, 'vowStateChangedNotification');
        const focus = spyOn(first.trigger, 'focus').and.callThrough();
        close();
        expect(focus).toHaveBeenCalled();
        expect(document.activeElement).toBe(first.trigger);

        selectUnit(2);
        const second = start(model);
        expect(second.command).not.toEqual(jasmine.objectContaining({ state: jasmine.anything() }));
        expect(second.command).toEqual(jasmine.objectContaining({
          parameters: jasmine.arrayContaining([{ key: 'JOURNAL', value: journal }])
        }));
        sendState(second, journal);

        selectUnit(1);
        expect(start(model).command).toEqual(jasmine.objectContaining({
          state, parameters: jasmine.arrayContaining([{ key: 'JOURNAL', value: journal }])
        }));
        close();
        selectUnit(2);
        expect(start(model).command).toEqual(jasmine.objectContaining({ state: journal }));
        close();
      }));
    }
  }

  it('retains unit journals through pause and clears all of them on run reset', fakeAsync(() => {
    sendState(start(), journal, 'vowStateChangedNotification');
    controller.state$.next('PAUSED');
    tick();
    controller.state$.next('RUNNING');
    fixture.detectChanges();
    expect(start().command).toEqual(jasmine.objectContaining({ state: journal }));
    close();
    selectUnit(2);
    sendState(start(), journal);

    controller.runReset$.next();
    for (const sequenceId of [1, 2]) {
      selectUnit(sequenceId);
      expect(start().command).not.toEqual(jasmine.objectContaining({ state: jasmine.anything() }));
      close();
    }
  }));

  for (const status of ['PAUSED', 'TERMINATED', 'ERROR'] as const) {
    it(`hides the calculator and rejects stale clicks in state ${status}`, () => {
      const oldButton = button();
      controller.state$.next(status);
      oldButton.click();
      fixture.detectChanges();
      expect(host().querySelector('[data-cy="calculator"]')).toBeNull();
      http.expectNone(request => request.url.includes('/file/'));
    });
  }

  it('hides the calculator while loading and rejects stale clicks after a disabled unit is selected', () => {
    const oldButton = button();
    controller.unitContentReady$.next(false);
    oldButton.click();
    fixture.detectChanges();
    expect(host().querySelector('[data-cy="calculator"]')).toBeNull();
    http.expectNone(request => request.url.includes('/file/'));
    controller.unitContentReady$.next(true);
    fixture.detectChanges();
    const newButton = button();
    controller.currentUnitSequenceId = 3;
    newButton.click();
    fixture.detectChanges();
    http.expectNone(request => request.url.includes('/file/'));
  });

  it('keeps the button visible without a workspace calculator and opens the provisioning error', fakeAsync(() => {
    controller.widgets = {};
    button().click();
    fixture.detectChanges();
    tick();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('CALCULATOR oder CALC');
    http.expectNone(request => request.url.includes('/file/'));
    close();
  }));

  it('blocks repeated clicks and closes without focus restoration on a unit change', fakeAsync(() => {
    const oldButton = button();
    start();
    oldButton.click();
    http.expectNone(request => request.url.includes('/file/'));
    const focus = spyOn(oldButton, 'focus');
    selectUnit(3);
    tick();
    expect(dialog.openDialogs.length).toBe(0);
    expect(focus).not.toHaveBeenCalled();
  }));
});
