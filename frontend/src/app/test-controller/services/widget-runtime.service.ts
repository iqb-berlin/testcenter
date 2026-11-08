import { Injectable, OnDestroy, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  combineLatest, merge, Observable, Subscription
} from 'rxjs';
import {
  distinctUntilChanged, filter, first, skip
} from 'rxjs/operators';
import { MainDataService } from '@shared/shared.module';
import { WidgetWindowComponent, WidgetWindowData } from '../components/widget-window/widget-window.component';
import { WidgetSession } from '../classes/widget-session.class';
import { WidgetParameter } from '../interfaces/widget.interfaces';
import { TestControllerService } from './test-controller.service';

export interface WidgetRequest {
  id?: string;
  title: string;
  html: Observable<string>;
  parameters: WidgetParameter[];
  // state from an earlier session, handed to the widget at the start
  state?: string;
  // the window's size, made smaller where the browser window is too small for it
  size?: { width: string; height: string };
  // Whether closing the widget without its return loses the test taker's work (e.g. a widget a player waits for).
  // Such a widget is not replaced by another request.
  losesWorkOnClose: boolean;
  onStateChanged?: (state: string) => void;
  onReturn?: (state: string | undefined, saveState: boolean) => void;
  // called once when the window closes, for whatever reason
  onClosed?: () => void;
}

interface CurrentWidget {
  id?: string;
  losesWorkOnClose: boolean;
  ref: MatDialogRef<WidgetWindowComponent>;
  stop: () => void;
}

const DEFAULT_WIDGET_WINDOW_SIZE = {
  width: '1200px',
  height: '800px'
};

// A widget window keeps a margin to the edges of the browser window, so its title bar stays visible for dragging.
const WIDGET_WINDOW_MAX_SIZE = {
  width: '95vw',
  height: '95vh'
};

// Opens widgets in a window and runs them until they return or the situation changes. One widget at a time.
// Provided by the test controller component, so it ends with the test.
@Injectable()
export class WidgetRuntimeService implements OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly tcs = inject(TestControllerService);
  private readonly mds = inject(MainDataService);
  private readonly subscriptions = new Subscription();
  private currentWidget: CurrentWidget | undefined;

  constructor() {
    // Close the widget on unit navigation, logout or test state change.
    this.subscriptions.add(merge(
      this.tcs.currentUnitSequenceId$.pipe(distinctUntilChanged(), skip(1)),
      this.tcs.state$.pipe(distinctUntilChanged(), skip(1)),
      this.mds.authData$.pipe(filter(authData => !authData))
    ).subscribe(() => this.close()));
  }

  // Returns whether the widget was opened. A request is ignored while a widget that would lose work is open; that
  // one gets the focus instead. So does an open widget with the request's id. Any other open widget is replaced.
  open(request: WidgetRequest): boolean {
    if (request.id !== undefined && this.currentWidget?.id === request.id) {
      this.focusCurrentWidget();
      return false;
    }
    if (!this.closeReplaceableWidget()) return false;

    const ref = this.openWindow(request.title, request.size);
    const view = ref.componentInstance;
    let session: WidgetSession | undefined;
    const loading = new Subscription();
    let closed = false;
    const widget: CurrentWidget = {
      id: request.id,
      losesWorkOnClose: request.losesWorkOnClose,
      ref,
      stop: () => {
        loading.unsubscribe();
        session?.close();
        // the window stops both on closing and once its closing starts
        if (closed) return;
        closed = true;
        request.onClosed?.();
      }
    };
    this.setCurrentWidget(widget);
    // A widget that failed has no work to lose, and the next request for it starts it anew.
    const markFailed = (): void => {
      widget.id = undefined;
      widget.losesWorkOnClose = false;
    };

    // the window's iframe exists only once the window is rendered
    loading.add(combineLatest([request.html.pipe(first()), ref.afterOpened()]).subscribe({
      next: ([content]) => view.start(content, (widgetWindow: Window) => {
        session = new WidgetSession({
          window: widgetWindow,
          messages: this.mds.postMessage$,
          parameters: request.parameters,
          sharedParameters: this.tcs.sharedParameters,
          state: request.state,
          onReady: () => view.showRunning(),
          onStateChanged: (state, sharedParameters) => {
            if (sharedParameters) this.tcs.addSharedParameters(sharedParameters);
            if (state !== undefined) request.onStateChanged?.(state);
          },
          onReturn: (state, saveState) => {
            ref.close();
            request.onReturn?.(state, saveState);
          },
          onError: (error: Error) => {
            console.error('Widget could not be started:', request.title, error);
            view.showStartupError();
            markFailed();
          }
        });
      }),
      error: (error: unknown) => {
        console.error('Widget could not be loaded:', request.title, error);
        view.showDownloadError();
        markFailed();
      }
    }));
    return true;
  }

  // Shows in the widget window that a widget isn't available, unless a widget that would lose work is open. Replaced
  // by the next request like any widget that doesn't lose work.
  showUnavailable(title: string): void {
    if (!this.closeReplaceableWidget()) return;

    const ref = this.openWindow(title);
    ref.componentInstance.showUnavailable();
    this.setCurrentWidget({ losesWorkOnClose: false, ref, stop: () => {} });
  }

  close(): void {
    // stops the widget right away; the window reports its closing only once its animation starts
    this.currentWidget?.stop();
    this.currentWidget?.ref.close();
    this.currentWidget = undefined;
  }

  ngOnDestroy(): void {
    this.close();
    this.subscriptions.unsubscribe();
  }

  // Closes the open widget unless that would lose work; such a widget gets the focus instead. Returns whether a new
  // window may open.
  private closeReplaceableWidget(): boolean {
    if (this.currentWidget?.losesWorkOnClose) {
      this.focusCurrentWidget();
      return false;
    }
    this.close();
    return true;
  }

  private focusCurrentWidget(): void {
    if (this.currentWidget) document.getElementById(this.currentWidget.ref.id)?.focus();
  }

  private openWindow(
    title: string,
    size: { width: string; height: string } = DEFAULT_WIDGET_WINDOW_SIZE
  ): MatDialogRef<WidgetWindowComponent> {
    return this.dialog.open<WidgetWindowComponent, WidgetWindowData>(WidgetWindowComponent, {
      data: { title },
      width: size.width,
      height: size.height,
      maxWidth: WIDGET_WINDOW_MAX_SIZE.width,
      maxHeight: WIDGET_WINDOW_MAX_SIZE.height,
      // not modal: the unit stays usable next to the widget
      hasBackdrop: false,
      ariaModal: false,
      autoFocus: 'dialog',
      panelClass: 'widget-window'
    });
  }

  private setCurrentWidget(widget: CurrentWidget): void {
    this.currentWidget = widget;
    // closed by the test taker (close button, Escape)
    widget.ref.beforeClosed().subscribe(() => {
      widget.stop();
      if (this.currentWidget === widget) this.currentWidget = undefined;
    });
  }
}
