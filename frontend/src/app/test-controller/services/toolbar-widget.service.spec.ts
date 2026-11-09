import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { BookletWidget } from '@shared/shared.module';
import { ToolbarWidget, ToolbarWidgetService } from './toolbar-widget.service';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { WidgetDeliveryService } from './widget-delivery.service';
import { WidgetCloseReason, WidgetRequest, WidgetRuntimeService } from './widget-runtime.service';
import { StateReportEntry, TestControllerState } from '../interfaces/test-controller.interfaces';

describe('ToolbarWidgetService', () => {
  const calculator: BookletWidget = { model: 'CALCULATOR', parameters: [{ key: 'JOURNAL_LINES', value: '2' }] };
  const formulas: BookletWidget = { model: 'FORMULAS', parameters: [] };
  let service: ToolbarWidgetService;
  let tcs: {
    state$: BehaviorSubject<TestControllerState>;
    currentUnitSequenceId$: BehaviorSubject<number>;
    currentUnitSequenceId: number;
    currentUnit: { id: string; alias: string; widgets: BookletWidget[] } | undefined;
    testId: string;
    testMode: { saveResponses: boolean };
  };
  let runtime: { open: jasmine.Spy; showUnavailable: jasmine.Spy };
  let addUnitLog: jasmine.Spy;

  beforeEach(() => {
    tcs = {
      state$: new BehaviorSubject<TestControllerState>('RUNNING'),
      currentUnitSequenceId$: new BehaviorSubject(1),
      currentUnitSequenceId: 1,
      currentUnit: { id: 'u1', alias: 'u1', widgets: [calculator, formulas] },
      testId: 't1',
      testMode: { saveResponses: true }
    };
    addUnitLog = jasmine.createSpy('addUnitLog');
    runtime = {
      open: jasmine.createSpy('open').and.returnValue(true),
      showUnavailable: jasmine.createSpy('showUnavailable')
    };
    TestBed.configureTestingModule({
      providers: [
        ToolbarWidgetService,
        { provide: TestControllerService, useValue: tcs },
        { provide: WidgetRuntimeService, useValue: runtime },
        { provide: BackendService, useValue: { addUnitLog } },
        {
          provide: WidgetDeliveryService,
          useValue: {
            findWidget: (model: string) => (model === 'CALCULATOR' ?
              { title: 'IQB Widget Taschenrechner', html: of('<html></html>') } :
              undefined)
          }
        }
      ]
    });
    service = TestBed.inject(ToolbarWidgetService);
  });

  function goToUnit(sequenceId: number, widgets: BookletWidget[]): void {
    tcs.currentUnitSequenceId = sequenceId;
    tcs.currentUnit = { id: `u${sequenceId}`, alias: `u${sequenceId}`, widgets };
    tcs.currentUnitSequenceId$.next(sequenceId);
  }

  function getToolbarWidgets(): Promise<ToolbarWidget[]> {
    return firstValueFrom(service.widgets);
  }

  function openedRequest(): WidgetRequest {
    return runtime.open.calls.mostRecent().args[0] as WidgetRequest;
  }

  it('offers the widgets of the current unit, titled and with an icon', async () => {
    expect(await getToolbarWidgets()).toEqual([
      { widget: calculator, title: 'Taschenrechner', icon: 'calculate' },
      { widget: formulas, title: 'Widget', icon: 'widgets' }
    ]);

    goToUnit(2, []);
    expect(await getToolbarWidgets()).toEqual([]);
  });

  it('offers no widgets while the test does not run', async () => {
    tcs.state$.next('PAUSED');
    expect(await getToolbarWidgets()).toEqual([]);
  });

  it('opens a widget with the parameters from the booklet, sized for it', async () => {
    service.open((await getToolbarWidgets())[0]);

    expect(openedRequest()).toEqual(jasmine.objectContaining({
      title: 'Taschenrechner',
      parameters: [{ key: 'JOURNAL_LINES', value: '2' }],
      state: undefined,
      size: { width: '400px', height: '600px' },
      losesWorkOnClose: false
    }));
  });

  it('keeps the state of each widget per unit', async () => {
    service.open((await getToolbarWidgets())[0]);
    openedRequest().onStateChanged?.('1+1');
    goToUnit(2, [calculator]);
    service.open((await getToolbarWidgets())[0]);
    expect(openedRequest().state).toBeUndefined();
    openedRequest().onReturn?.('2*2', true);

    goToUnit(1, [calculator, formulas]);
    service.open((await getToolbarWidgets())[0]);
    expect(openedRequest().state).toBe('1+1');
    goToUnit(2, [calculator]);
    service.open((await getToolbarWidgets())[0]);
    expect(openedRequest().state).toBe('2*2');
  });

  it('keeps the states of another test apart', async () => {
    service.open((await getToolbarWidgets())[0]);
    openedRequest().onStateChanged?.('1+1');
    tcs.testId = 't2';
    service.open((await getToolbarWidgets())[0]);

    expect(openedRequest().state).toBeUndefined();
  });

  it('identifies a widget by unit and model, so a second click only focuses it', async () => {
    service.open((await getToolbarWidgets())[0]);
    const { id } = openedRequest();
    service.open((await getToolbarWidgets())[0]);
    expect(openedRequest().id).toBe(id);
  });

  it('shows that a widget the workspace lacks is unavailable', async () => {
    service.open((await getToolbarWidgets())[1]);

    expect(runtime.showUnavailable).toHaveBeenCalledOnceWith('Widget');
    expect(runtime.open).not.toHaveBeenCalled();
  });

  describe('logging', () => {
    function getLoggedEntries(): [string, string, string][] {
      return addUnitLog.calls.allArgs().map((args) => {
        const [, unitName, , [{ key, content }]] = args as [string, string, string, StateReportEntry<string>[]];
        return [unitName, key, content];
      });
    }

    function journal(...calculations: string[]): string {
      return JSON.stringify(calculations.map(asLatex => ({ asLatex, asImage: '' })));
    }

    it('logs opening and closing in the unit the widget was opened in', async () => {
      service.open((await getToolbarWidgets())[0]);
      goToUnit(2, [calculator]);
      openedRequest().onClosed?.('testcenter');

      expect(getLoggedEntries()).toEqual([
        ['u1', 'WIDGET_OPENED', 'CALCULATOR'],
        ['u1', 'WIDGET_CLOSED', 'CALCULATOR']
      ]);
    });

    it('logs each new calculation, not the state the calculator starts with', async () => {
      service.open((await getToolbarWidgets())[0]);
      openedRequest().onStateChanged?.(journal('1+1=2'));
      openedRequest().onClosed?.('testTaker');
      service.open((await getToolbarWidgets())[0]);
      openedRequest().onStateChanged?.(journal('1+1=2'));
      openedRequest().onReturn?.(journal('1+1=2', '2\\cdot3=6'), true);

      expect(getLoggedEntries().filter(([, key]) => key === 'CALCULATOR_CALCULATION')).toEqual([
        ['u1', 'CALCULATOR_CALCULATION', '1+1=2'],
        ['u1', 'CALCULATOR_CALCULATION', '2\\cdot3=6']
      ]);
    });

    it('logs nothing when the test saves no responses', async () => {
      tcs.testMode.saveResponses = false;
      service.open((await getToolbarWidgets())[0]);
      openedRequest().onStateChanged?.(journal('1+1=2'));
      openedRequest().onClosed?.('testTaker');

      expect(addUnitLog).not.toHaveBeenCalled();
    });
  });

  describe('calculator peek', () => {
    const image = 'data:image/png;base64,AAAA';

    function journal(...calculations: { asLatex: string; asImage: string | null }[]): string {
      return JSON.stringify(calculations);
    }

    async function calculateAndClose(reason: WidgetCloseReason): Promise<void> {
      service.open((await getToolbarWidgets())[0]);
      openedRequest().onStateChanged?.(journal({ asLatex: '1+1=2', asImage: image }));
      openedRequest().onClosed?.(reason);
    }

    it('shows the newest calculation once the test taker closes the calculator', async () => {
      service.open((await getToolbarWidgets())[0]);
      openedRequest().onStateChanged?.(journal({ asLatex: '1+1=2', asImage: image }));
      expect(service.calculatorPeek()).toBeUndefined();
      openedRequest().onClosed?.('testTaker');

      expect(service.calculatorPeek()).toEqual({ latex: '1+1=2', image });
    });

    it('shows the newest calculation once the calculator returns', async () => {
      service.open((await getToolbarWidgets())[0]);
      openedRequest().onReturn?.(journal({ asLatex: '1+1=2', asImage: image }), true);
      openedRequest().onClosed?.('widget');

      expect(service.calculatorPeek()).toEqual({ latex: '1+1=2', image });
    });

    it('shows nothing when the Testcenter closes the calculator', async () => {
      await calculateAndClose('testcenter');

      expect(service.calculatorPeek()).toBeUndefined();
    });

    it('shows nothing when the newest calculation has no image', async () => {
      service.open((await getToolbarWidgets())[0]);
      openedRequest().onStateChanged?.(journal(
        { asLatex: '1+1=2', asImage: image },
        { asLatex: '2\\cdot3=6', asImage: null }
      ));
      openedRequest().onClosed?.('testTaker');

      expect(service.calculatorPeek()).toBeUndefined();
    });

    it('is gone when the calculator opens again', async () => {
      await calculateAndClose('testTaker');
      service.open((await getToolbarWidgets())[0]);

      expect(service.calculatorPeek()).toBeUndefined();
    });

    it('stays when the calculator does not open', async () => {
      await calculateAndClose('testTaker');
      runtime.open.and.returnValue(false);
      service.open((await getToolbarWidgets())[0]);

      expect(service.calculatorPeek()).toEqual({ latex: '1+1=2', image });
    });

    it('is gone when the test taker closes it', async () => {
      await calculateAndClose('testTaker');
      service.closeCalculatorPeek();

      expect(service.calculatorPeek()).toBeUndefined();
    });

    it('is gone when the unit changes and does not come back with the unit', async () => {
      await calculateAndClose('testTaker');
      goToUnit(2, [calculator]);
      expect(service.calculatorPeek()).toBeUndefined();

      goToUnit(1, [calculator]);
      expect(service.calculatorPeek()).toBeUndefined();
    });

    it('is gone when the test stops running', async () => {
      await calculateAndClose('testTaker');
      tcs.state$.next('PAUSED');

      expect(service.calculatorPeek()).toBeUndefined();
    });
  });
});
