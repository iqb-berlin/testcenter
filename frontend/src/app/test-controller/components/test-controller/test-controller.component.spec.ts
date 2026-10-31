import { signal } from '@angular/core';
import { CalculatorService } from '../../services/calculator.service';
import { TestControllerModule } from '../../test-controller.module';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
  Booklet, Command, TestControllerState, Testlet, Unit, WindowFocusState
} from '../../interfaces/test-controller.interfaces';
import { TimerData } from '../../classes/test-controller.classes';

function createController() {
  const data: { booklet: Booklet | null; units: Record<number, Unit> } = {
    booklet: null, units: {}
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
    setUnitNavigationRequest: jasmine.createSpy('setUnitNavigationRequest')
  };
}

const journal = '[{"asLatex":"1+1=2","asImage":""}]';
describe('TestControllerComponent calculator header', () => {
  let fixture: ComponentFixture<TestControllerComponent>;
  let component: TestControllerComponent;
  let calculator: { open: jasmine.Spy; result: ReturnType<typeof signal<undefined>>; dismissResult: () => void };
  let controller: ReturnType<typeof createController>;

  beforeEach(fakeAsync(() => {
    controller = createController();
    calculator = { open: jasmine.createSpy('open'), result: signal(undefined), dismissResult: () => {} };
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
          authData$: new Subject<void>(), postMessage$: new Subject<MessageEvent>(), appConfig: { fileServiceUri: '' },
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
    }).overrideComponent(TestControllerComponent, { set: { providers: [
      { provide: CalculatorService, useValue: calculator }
    ] } });
    controller.booklet = TestBed.inject(TestLoaderService).parseBookletXml(`<Booklet>
      <Metadata><Id>header-test</Id><Label>Header test</Label></Metadata><Units>
        <Testlet id="configured"><Calculator mode="SCIENTIFIC" journalLines="5" maxImageWidthPx="333">
          <Journal>${journal}</Journal></Calculator><Unit id="u1" label="Configured"/>
          <Testlet id="child"><Calculator/><Unit id="u2" label="Child"/></Testlet>
          <Testlet id="hidden"><Unit id="u3" label="Hidden"/></Testlet>
          <Testlet id="defaults"><Calculator/><Unit id="u4" label="Defaults"/></Testlet>
        </Testlet><Testlet id="absent"><Unit id="u5" label="No calculator"/></Testlet>
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
  }));

  afterEach(() => {
    fixture.destroy();
    controller.currentUnitSequenceId$.complete();
    controller.navigation$.complete();
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

  it('tracks explicit child, absent and default configurations across units', () => {
    selectUnit(2);
    expect(button()).toBeTruthy();
    selectUnit(3);
    expect(host().querySelector('[data-cy="calculator"]')).toBeNull();
    selectUnit(4);
    expect(button()).toBeTruthy();
    selectUnit(5);
    expect(host().querySelector('[data-cy="calculator"]')).toBeNull();
  });

  for (const status of ['PAUSED', 'TERMINATED', 'ERROR'] as const) {
    it(`hides the calculator and rejects stale clicks in state ${status}`, () => {
      const oldButton = button();
      controller.state$.next(status);
      oldButton.click();
      fixture.detectChanges();
      expect(host().querySelector('[data-cy="calculator"]')).toBeNull();
      expect(calculator.open).not.toHaveBeenCalled();
    });
  }

  it('hides the calculator while loading and rejects stale clicks after a disabled unit is selected', () => {
    const oldButton = button();
    controller.unitContentReady$.next(false);
    oldButton.click();
    fixture.detectChanges();
    expect(host().querySelector('[data-cy="calculator"]')).toBeNull();
    expect(calculator.open).not.toHaveBeenCalled();
    controller.unitContentReady$.next(true);
    fixture.detectChanges();
    const newButton = button();
    controller.currentUnitSequenceId = 3;
    newButton.click();
    fixture.detectChanges();
    expect(calculator.open).not.toHaveBeenCalled();
  });

  it('passes authored and default configuration to the calculator service', () => {
    for (const [unit, mode, lines, width, state] of [
      [1, 'SCIENTIFIC', '5', '333', journal], [4, 'SIMPLE', '0', '200', '[]']
    ] as const) {
      selectUnit(unit);
      const trigger = button();
      trigger.click();
      expect(calculator.open).toHaveBeenCalledWith({ trigger, parameters: [
        { key: 'MODE', value: mode }, { key: 'JOURNAL_LINES', value: lines },
        { key: 'MAX_IMAGE_WIDTH_PX', value: width }, { key: 'JOURNAL', value: state }
      ] });
    }
  });
});
