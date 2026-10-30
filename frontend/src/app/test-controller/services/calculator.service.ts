import { Injectable, OnDestroy, signal } from '@angular/core';
import { merge, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { CustomtextService, MainDataService, customTextDefaults } from '@shared/shared.module';
import { BackendService } from './backend.service';
import { TestControllerService } from './test-controller.service';
import { HostWidgetRequest, WidgetBehavior, WidgetRuntimeService } from './widget-runtime.service';
import { CalculatorResult, calculatorFormula, calculatorResult } from '../util/calculator-result.util';

export type CalculatorWidgetRequest = Pick<HostWidgetRequest, 'parameters' | 'trigger' | 'state'>;

@Injectable()
export class CalculatorService implements OnDestroy {
  private readonly subscriptions = new Subscription();
  private readonly journals = new Map<string, string>();
  private readonly lastResult = signal<CalculatorResult | undefined>(undefined);
  readonly result = this.lastResult.asReadonly();

  constructor(private readonly tcs: TestControllerService,
              private readonly mds: MainDataService,
              private readonly backend: BackendService,
              private readonly runtime: WidgetRuntimeService,
              private readonly cts: CustomtextService) {
    this.subscriptions.add(this.tcs.runReset$.subscribe(() => {
      this.journals.clear();
      this.dismissResult();
    }));
    this.subscriptions.add(merge(
      this.tcs.currentUnitSequenceId$.pipe(distinctUntilChanged()),
      this.mds.authData$
    ).subscribe(() => this.dismissResult()));
  }

  supports(model: string): boolean {
    return model === 'CALCULATOR' || model === 'CALC';
  }

  open(request: CalculatorWidgetRequest): void {
    if (this.runtime.isBusy()) return;
    const resourcePath = this.tcs.getWidgetResourcePath('CALCULATOR');
    if (resourcePath === undefined) {
      this.runtime.showUnavailable(
        this.cts.getCustomText('booklet_calculator') || customTextDefaults.booklet_calculator.defaultvalue,
        this.cts.getCustomText('booklet_calculatorUnavailable') ||
        customTextDefaults.booklet_calculatorUnavailable.defaultvalue,
        request.trigger
      );
      return;
    }
    this.runtime.openHost({ ...request, resourcePath, model: 'CALCULATOR' }, this.createBehavior(resourcePath, true));
  }

  createBehavior(resourcePath: string, showResult = false): WidgetBehavior {
    // Only the toolbar calculator keeps a host journal; player elements own their state.
    const stateKey = showResult ? JSON.stringify([resourcePath, this.tcs.currentUnitSequenceId]) : undefined;
    const testId = this.tcs.testId;
    const logUnit = this.tcs.testMode.saveResponses ? this.tcs.currentUnit : null;
    let sessionId: string | undefined;
    const log = (key: string, content: Record<string, unknown> = {}, timeStamp = Date.now()): void => {
      if (!logUnit || sessionId === undefined) return;
      this.backend.addUnitLog(testId, logUnit.alias, logUnit.id, [{
        key, timeStamp, content: { sessionId, ...content }
      }]);
    };
    return {
      colorScheme: 'light',
      state: stateKey === undefined ? undefined : this.journals.get(stateKey),
      onState: (state) => {
        if (stateKey !== undefined) this.journals.set(stateKey, state);
      },
      onReady: (id) => {
        sessionId = id;
        log('CALCULATOR_OPENED');
      },
      onStateChanged: (state, timeStamp) => {
        if (!logUnit) return;
        const asLatex = calculatorFormula(state);
        if (asLatex !== undefined) log('CALCULATOR_STATE_CHANGED', { asLatex }, timeStamp);
      },
      onClosing: (reason, returnReceived) => log('CALCULATOR_CLOSED', { reason, returnReceived }),
      onClosed: (state) => {
        if (!showResult) return;
        const result = calculatorResult(state);
        if (result) this.lastResult.set(result);
      }
    };
  }

  dismissResult(): void {
    this.lastResult.set(undefined);
  }

  ngOnDestroy(): void {
    this.journals.clear();
    this.dismissResult();
    this.subscriptions.unsubscribe();
  }
}
