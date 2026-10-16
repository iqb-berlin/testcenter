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

  beforeEach(fakeAsync(() => {
    controller = createController();
    messages = new Subject<MessageEvent>();
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
          authData$: new Subject<void>(), postMessage$: messages, appConfig: { fileServiceUri: '' },
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

  function start() {
    const trigger = button();
    trigger.click();
    fixture.detectChanges();
    http.expectOne('/api/file/header-group/ws_1/Resource/calculator.html').flush('<html></html>');
    tick();
    const source = document.querySelector<HTMLIFrameElement>('[role="dialog"] iframe')?.contentWindow;
    if (!source) throw new Error('Missing calculator window');
    const post = spyOn(source, 'postMessage');
    messages.next(new MessageEvent('message', { source, data: { type: 'vowReadyNotification', metadata } }));
    const command: unknown = post.calls.mostRecent().args[0];
    return { source, post, command, trigger };
  }

  function close(): void {
    document.querySelector<HTMLButtonElement>('[aria-label="Widget schließen"]')?.click();
    tick();
  }

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

  it('restores retained state while continuing to pass the configured journal parameter', fakeAsync(() => {
    const first = start();
    if (first.command === null || typeof first.command !== 'object' || !('sessionId' in first.command)) {
      throw new Error('Missing widget start');
    }
    messages.next(new MessageEvent('message', { source: first.source, data: {
      type: 'vowStateChangedNotification', sessionId: first.command.sessionId,
      timeStamp: '2026-10-16T12:00:00Z', state: ''
    } }));
    const trigger = first.trigger;
    expect(trigger.isConnected).toBeTrue();
    expect(button()).toBe(trigger);
    expect(controller.currentUnitSequenceId).toBe(1);
    const focus = spyOn(trigger, 'focus').and.callThrough();
    close();
    expect(dialog.openDialogs.length).toBe(0);
    expect(focus).toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
    selectUnit(2);
    expect(start().command).toEqual(jasmine.objectContaining({
      state: '', parameters: jasmine.arrayContaining([{ key: 'JOURNAL', value: journal }])
    }));
    close();
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
