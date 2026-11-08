import { Injectable, inject } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BookletWidget, CustomtextService } from '@shared/shared.module';
import { BackendService } from './backend.service';
import { TestControllerService } from './test-controller.service';
import { WidgetDeliveryService } from './widget-delivery.service';
import { WidgetRuntimeService } from './widget-runtime.service';
import { getWidgetIcon, getWidgetTitle, getWidgetWindowSize } from '../util/widget-model.util';
import { findNewCalculation } from '../util/calculator-state.util';

export interface ToolbarWidget {
  widget: BookletWidget;
  title: string;
  icon: string;
}

// Opens the widgets the booklet offers in the current unit, keeping each one's state per unit. The state lives as long
// as the test runs in this window: it is lost on reload. Provided by the test controller component.
@Injectable()
export class ToolbarWidgetService {
  private readonly tcs = inject(TestControllerService);
  private readonly delivery = inject(WidgetDeliveryService);
  private readonly runtime = inject(WidgetRuntimeService);
  private readonly cts = inject(CustomtextService);
  private readonly bs = inject(BackendService);
  // the last state of each widget, by test, unit and model: the test controller may load another test in place
  private readonly states = new Map<string, string>();

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

  open({ widget, title }: ToolbarWidget): void {
    const delivered = this.delivery.findWidget(widget.model);
    if (!delivered) {
      this.runtime.showUnavailable(title);
      return;
    }
    const stateKey = `${this.tcs.testId}/${this.tcs.currentUnitSequenceId}/${widget.model}`;
    const log = this.createUnitLog();
    const storeState = (state: string): void => {
      if (widget.model === 'CALCULATOR') {
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
      onClosed: () => log('WIDGET_CLOSED', widget.model)
    });
    if (isOpened) log('WIDGET_OPENED', widget.model);
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
