import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { CustomtextService, MainDataService } from '@shared/shared.module';
import { BackendService } from './backend.service';
import { TestControllerService } from './test-controller.service';
import { CalculatorService } from './calculator.service';
import { WidgetBehavior, WidgetRuntimeService } from './widget-runtime.service';
import { getTestData } from '../test/test-data';

const image = 'data:image/png;base64,aW1hZ2U=';
const journal = JSON.stringify([{ asLatex: '1+2=3', asImage: image }]);

describe('CalculatorService', () => {
  let service: CalculatorService;
  let tcs: Pick<TestControllerService, 'currentUnitSequenceId' | 'currentUnitSequenceId$' | 'runReset$' |
    'testId' | 'testMode' | 'currentUnit' | 'getWidgetResourcePath'>;
  let navigation: BehaviorSubject<number>;
  let reset: Subject<void>;
  let auth: Subject<void>;
  const runtime = { isBusy: jasmine.createSpy('isBusy'),
    openHost: jasmine.createSpy<(request: unknown, behavior: WidgetBehavior) => void>('openHost'),
    showUnavailable: jasmine.createSpy('showUnavailable') };
  const backend = { addUnitLog: jasmine.createSpy('addUnitLog') };
  const trigger = document.createElement('button');

  beforeEach(() => {
    navigation = new BehaviorSubject(1);
    reset = new Subject<void>();
    auth = new Subject<void>();
    tcs = {
      currentUnitSequenceId: 1, currentUnitSequenceId$: navigation, runReset$: reset,
      testId: 'run', testMode: { saveResponses: true } as TestControllerService['testMode'],
      currentUnit: getTestData().Units.u1, getWidgetResourcePath: () => 'calc.html'
    };
    runtime.isBusy.and.returnValue(false);
    runtime.openHost.calls.reset();
    runtime.showUnavailable.calls.reset();
    backend.addUnitLog.calls.reset();
    TestBed.configureTestingModule({ providers: [
      CalculatorService, CustomtextService,
      { provide: TestControllerService, useValue: tcs }, { provide: MainDataService, useValue: { authData$: auth } },
      { provide: WidgetRuntimeService, useValue: runtime }, { provide: BackendService, useValue: backend }
    ] });
    service = TestBed.inject(CalculatorService);
  });

  function open(): WidgetBehavior {
    service.open({ trigger, parameters: [{ key: 'MODE', value: 'SCIENTIFIC' }] });
    return runtime.openHost.calls.mostRecent().args[1];
  }

  it('launches the resolved resource with the authored parameters and light theme', () => {
    expect(open().colorScheme).toBe('light');
    expect(runtime.openHost).toHaveBeenCalledWith({
      resourcePath: 'calc.html', model: 'CALCULATOR', trigger, parameters: [{ key: 'MODE', value: 'SCIENTIFIC' }]
    }, jasmine.any(Object));
    runtime.isBusy.and.returnValue(true);
    service.open({ trigger, parameters: [] });
    expect(runtime.openHost).toHaveBeenCalledTimes(1);
  });

  it('uses custom help text when the calculator resource is unavailable', () => {
    tcs.getWidgetResourcePath = () => undefined;
    TestBed.inject(CustomtextService).addCustomTexts({
      booklet_calculator: 'Calculator tool', booklet_calculatorUnavailable: 'Ask your supervisor'
    });
    service.open({ trigger, parameters: [] });
    expect(runtime.showUnavailable).toHaveBeenCalledWith('Calculator tool', 'Ask your supervisor', trigger);
    expect(runtime.openHost).not.toHaveBeenCalled();
  });

  it('isolates journals by unit occurrence and resource, preserving empty state until reset', () => {
    open().onState('');
    tcs.currentUnitSequenceId = 2;
    navigation.next(2);
    expect(open().state).toBeUndefined();
    open().onState(journal);
    tcs.currentUnitSequenceId = 1;
    navigation.next(1);
    expect(open().state).toBe('');
    tcs.getWidgetResourcePath = () => 'other.html';
    expect(open().state).toBeUndefined();
    tcs.getWidgetResourcePath = () => 'calc.html';
    expect(open().state).toBe('');
    reset.next();
    expect(open().state).toBeUndefined();
    tcs.currentUnitSequenceId = 2;
    expect(open().state).toBeUndefined();
  });

  it('publishes only usable closed results, replaces them, and dismisses them on navigation or authentication', () => {
    const behavior = open();
    behavior.onState(journal);
    expect(service.result()).toBeUndefined();
    behavior.onClosed?.(journal);
    expect(service.result()).toEqual({ formula: '1+2=3', image });
    behavior.onClosed?.('[]');
    expect(service.result()?.formula).toBe('1+2=3');
    behavior.onClosed?.(journal.replace('1+2=3', '2+2=4'));
    expect(service.result()?.formula).toBe('2+2=4');
    service.dismissResult();
    expect(service.result()).toBeUndefined();
    behavior.onClosed?.(journal);
    navigation.next(2);
    expect(service.result()).toBeUndefined();
    behavior.onClosed?.(journal);
    auth.next();
    expect(service.result()).toBeUndefined();
  });

  it('keeps player calculator state separate from toolbar journals and previews', () => {
    open().onState('toolbar');
    const player = service.createBehavior('calc.html');
    expect(player.state).toBeUndefined();
    player.onState('player');
    player.onClosed?.(journal);
    expect(service.result()).toBeUndefined();
    expect(open().state).toBe('toolbar');
    expect(['CALC', 'CALCULATOR', 'PERIODIC_TABLE'].map(model => service.supports(model))).toEqual([true, true, false]);
  });

  it('logs the last formula and closure against the opening test and unit, without image data', () => {
    const behavior = open();
    behavior.onReady?.('session');
    behavior.onStateChanged?.(journal, 42);
    tcs.testId = 'other';
    const unit = tcs.currentUnit!;
    Object.assign(tcs, { currentUnit: getTestData().Units.u2 });
    behavior.onClosing?.('host_triggered', false);
    expect(backend.addUnitLog.calls.allArgs()).toEqual([
      ['run', unit.alias, unit.id, [{
        key: 'CALCULATOR_OPENED', timeStamp: jasmine.any(Number),
        content: { sessionId: 'session' } }]],
      ['run', unit.alias, unit.id, [{
        key: 'CALCULATOR_STATE_CHANGED', timeStamp: 42,
        content: { sessionId: 'session', asLatex: '1+2=3' } }]],
      ['run', unit.alias, unit.id, [{
        key: 'CALCULATOR_CLOSED', timeStamp: jasmine.any(Number),
        content: { sessionId: 'session', reason: 'host_triggered', returnReceived: false } }]]
    ]);
  });

  it('does not log before readiness or when response saving is disabled', () => {
    open().onClosing?.('user_called', false);
    tcs.testMode.saveResponses = false;
    const behavior = open();
    behavior.onReady?.('session');
    behavior.onStateChanged?.(journal, 42);
    behavior.onClosing?.('widget_return', true);
    expect(backend.addUnitLog).not.toHaveBeenCalled();
    service.ngOnDestroy();
    expect(service.result()).toBeUndefined();
  });
});
