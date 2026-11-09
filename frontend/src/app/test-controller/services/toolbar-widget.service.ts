import {
  Injectable, OnDestroy, inject, signal
} from '@angular/core';
import {
  combineLatest, merge, Observable, Subscription
} from 'rxjs';
import {
  distinctUntilChanged, filter, map, skip
} from 'rxjs/operators';
import { BookletWidget, CustomtextService } from '@shared/shared.module';
import { BackendService } from './backend.service';
import { TestControllerService } from './test-controller.service';
import { WidgetDeliveryService } from './widget-delivery.service';
import { WidgetRuntimeService } from './widget-runtime.service';
import { getWidgetIcon, getWidgetTitle, getWidgetWindowSize } from '../util/widget-model.util';
import { Calculation, findLatestCalculationWithImage, findNewCalculation } from '../util/calculator-state.util';

export interface ToolbarWidget {
  widget: BookletWidget;
  title: string;
  icon: string;
}

// Opens the widgets the booklet offers in the current unit, keeping each one's state per unit. The state lives as long
// as the test runs in this window: it is lost on reload. Provided by the test controller component.
@Injectable()
export class ToolbarWidgetService implements OnDestroy {
  private readonly tcs = inject(TestControllerService);
  private readonly delivery = inject(WidgetDeliveryService);
  private readonly runtime = inject(WidgetRuntimeService);
  private readonly cts = inject(CustomtextService);
  private readonly bs = inject(BackendService);
  private readonly subscriptions = new Subscription();
  // the last state of each widget, by test, unit and model: the test controller may load another test in place
  private readonly states = new Map<string, string>();
  private readonly latestCalculation = signal<Required<Calculation> | undefined>(undefined);

  // The calculator's newest calculation, shown once the test taker or the calculator closes it. Gone when the
  // calculator opens again, the unit changes or the test stops running.
  readonly calculatorPeek = this.latestCalculation.asReadonly();

  // the widgets the current unit offers, while the test runs
  readonly widgets: Observable<ToolbarWidget[]> = combineLatest([
    this.tcs.state$,
    this.tcs.currentUnitSequenceId$
  ]).pipe(
    map(([state]) => (state === 'RUNNING' ? this.tcs.currentUnit?.widgets ?? [] : [])
      .map(widget => ({
        widget,
        title: getWidgetTitle(widget.model, this.delivery.findWidget(widget.model)?.title, this.cts),
        icon: getWidgetIcon(widget.model)
      })))
  );

  constructor() {
    this.subscriptions.add(merge(
      this.tcs.currentUnitSequenceId$.pipe(distinctUntilChanged(), skip(1)),
      this.tcs.state$.pipe(filter(state => state !== 'RUNNING'))
    ).subscribe(() => this.closeCalculatorPeek()));
  }

  closeCalculatorPeek(): void {
    this.latestCalculation.set(undefined);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  open({ widget, title }: ToolbarWidget): void {
    const delivered = this.delivery.findWidget(widget.model);
    if (!delivered) {
      this.runtime.showUnavailable(title);
      return;
    }
    const stateKey = `${this.tcs.testId}/${this.tcs.currentUnitSequenceId}/${widget.model}`;
    const log = this.createUnitLog();
    const isCalculator = widget.model === 'CALCULATOR';
    const storeState = (state: string): void => {
      if (isCalculator) {
        const calculation = findNewCalculation(this.states.get(stateKey), state);
        if (calculation !== undefined) log('CALCULATOR_CALCULATION', calculation);
      }
      this.states.set(stateKey, state);
    };
    const isOpened = this.runtime.open({
      id: stateKey,
      title,
      html: delivered.html,
      parameters: widget.parameters,
      state: this.states.get(stateKey),
      size: getWidgetWindowSize(widget.model),
      losesWorkOnClose: false,
      onStateChanged: storeState,
      onReturn: (state, saveState) => {
        if (saveState && state !== undefined) storeState(state);
      },
      onClosed: (reason) => {
        log('WIDGET_CLOSED', widget.model);
        // when the Testcenter closes the calculator, the test taker is about to see something else
        if (isCalculator && reason !== 'testcenter') {
          this.latestCalculation.set(findLatestCalculationWithImage(this.states.get(stateKey)));
        }
      }
    });
    if (!isOpened) return;
    log('WIDGET_OPENED', widget.model);
    if (isCalculator) this.closeCalculatorPeek();
  }

  // Writes to the log of the current unit, also after the test taker has left it, if the test saves responses.
  private createUnitLog(): (key: string, content: string) => void {
    const { testId, currentUnit } = this.tcs;
    if (!this.tcs.testMode.saveResponses || !currentUnit) return () => {};
    return (key, content) => {
      this.bs.addUnitLog(testId, currentUnit.alias, currentUnit.id, [{ key, timeStamp: Date.now(), content }]);
    };
  }
}
