import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { BackendService } from './backend.service';
import { isLoadingFileLoaded, TestData } from '../interfaces/test-controller.interfaces';

export interface DeliveredWidget {
  title: string;
  html: Observable<string>;
}

// Temporary: widgets are found by model, as neither units nor booklets name them by id and version yet. The backend
// delivers one widget per model of the workspace (see GET /test).
@Injectable({
  providedIn: 'root'
})
export class WidgetDeliveryService {
  private readonly bs = inject(BackendService);
  private workspaceId = 0;
  private widgets: TestData['widgets'] = {};
  // HTML of the widgets downloaded so far, by model
  private readonly contents = new Map<string, string>();

  setWidgets(workspaceId: number, widgets: TestData['widgets']): void {
    this.workspaceId = workspaceId;
    this.widgets = widgets;
    this.contents.clear();
  }

  // The widget is downloaded when its HTML is first subscribed to and kept for the rest of the test.
  findWidget(model: string): DeliveredWidget | undefined {
    // the model comes from the player
    if (!Object.hasOwn(this.widgets, model)) return undefined;
    const widget = this.widgets[model];
    const content = this.contents.get(model);
    const html = content !== undefined ?
      of(content) :
      this.bs.getResource(this.workspaceId, widget.path)
        .pipe(
          filter(isLoadingFileLoaded),
          map(file => file.content),
          tap(downloaded => this.contents.set(model, downloaded))
        );
    return { title: widget.label, html };
  }
}
