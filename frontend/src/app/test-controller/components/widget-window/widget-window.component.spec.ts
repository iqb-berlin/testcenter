import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CustomtextService } from '@shared/shared.module';
import { WidgetWindowComponent } from './widget-window.component';

describe('WidgetWindowComponent', () => {
  let dialog: MatDialog;
  let ref: MatDialogRef<WidgetWindowComponent>;
  let component: WidgetWindowComponent;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule]
    });
    dialog = TestBed.inject(MatDialog);
    ref = dialog.open(WidgetWindowComponent, {
      data: { title: 'Periodensystem' }, width: '400px', height: '300px', panelClass: 'widget-window'
    });
    component = ref.componentInstance;
    tick();
  }));

  afterEach(fakeAsync(() => {
    dialog.closeAll();
    flush();
  }));

  function render(): void {
    ref.componentRef?.changeDetectorRef.detectChanges();
  }

  function find<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return document.querySelector<T>(`.widget-window ${selector}`);
  }

  it('shows the title', () => {
    expect(find('h2')?.textContent?.trim()).toBe('Periodensystem');
  });

  it('shows the loading status until the widget runs', () => {
    expect(find('.status')?.textContent).toContain('Widget wird geladen …');

    component.start('<html></html>', () => {});
    render();
    expect(find('.status')?.textContent).toContain('Widget wird gestartet …');
    expect(find('.frame-host')?.classList).toContain('hidden');

    component.showRunning();
    render();
    expect(find('.status')).toBeNull();
    expect(find('.frame-host')?.classList).not.toContain('hidden');
  });

  it('connects to the widget window before the widget is loaded', () => {
    let srcdocWhenConnected: string | undefined;
    let connectedWindow: Window | undefined;
    component.start('<html><body>widget</body></html>', (widgetWindow: Window) => {
      connectedWindow = widgetWindow;
      srcdocWhenConnected = find<HTMLIFrameElement>('iframe')?.srcdoc;
    });

    const iframe = find<HTMLIFrameElement>('iframe');
    expect(connectedWindow).toBe(iframe?.contentWindow as Window);
    expect(srcdocWhenConnected).toBe('');
    expect(iframe?.srcdoc).toBe('<html><body>widget</body></html>');
    expect(iframe?.title).toBe('Periodensystem');
  });

  it('fills the window with the widget', () => {
    component.start('<html></html>', () => {});
    component.showRunning();
    render();

    const iframe = find<HTMLIFrameElement>('iframe')?.getBoundingClientRect();
    const header = find('header')?.getBoundingClientRect();
    const window = find('.mat-mdc-dialog-surface')?.getBoundingClientRect();
    expect(iframe?.width).toBeCloseTo(window?.width ?? 0, 0);
    expect((iframe?.height ?? 0) + (header?.height ?? 0)).toBeCloseTo(window?.height ?? 0, 0);
  });

  it('shows an error instead of the widget', () => {
    component.start('<html></html>', () => {});
    component.showRunning();
    component.showError();
    render();
    expect(find('.status')?.textContent).toContain('Im Widget ist ein Fehler aufgetreten.');
    expect(find('iframe')).toBeNull();
  });

  it('uses custom texts', () => {
    TestBed.inject(CustomtextService).addCustomTexts({
      booklet_widgetLoading: 'Lädt',
      booklet_widgetStarting: 'Startet',
      booklet_widgetClose: 'Schließen',
      booklet_widgetError: 'Fehler'
    });
    render();
    expect(find('.status')?.textContent).toContain('Lädt');
    expect(find('header button')?.getAttribute('aria-label')).toBe('Schließen');

    component.start('<html></html>', () => {});
    render();
    expect(find('.status')?.textContent).toContain('Startet');

    component.showError();
    render();
    expect(find('.status')?.textContent).toContain('Fehler');
  });

  it('closes with the close button', fakeAsync(() => {
    let closed = false;
    ref.afterClosed().subscribe(() => {
      closed = true;
    });
    find('header button')?.click();
    flush();

    expect(closed).toBeTrue();
  }));

  it('removes the widget when the window closes', fakeAsync(() => {
    component.start('<html></html>', () => {});
    ref.close();
    flush();

    expect(document.querySelector('.widget-window iframe')).toBeNull();
  }));

  it('stays inside the browser window when dragged', () => {
    const title = find('h2') as HTMLElement;
    const start = title.getBoundingClientRect();
    const x = start.left + start.width / 2;
    const y = start.top + start.height / 2;
    // The CDK ignores a mousedown without `buttons` or `detail` as a click from a screen reader.
    const mouse = (target: EventTarget, type: string, clientX: number, clientY: number) => target.dispatchEvent(
      new MouseEvent(type, { bubbles: true, clientX, clientY, buttons: 1, detail: 1 })
    );
    mouse(title, 'mousedown', x, y);
    mouse(document, 'mousemove', x + 10, y + 10);
    mouse(document, 'mousemove', x + 5000, y + 5000);
    mouse(document, 'mouseup', x + 5000, y + 5000);

    const pane = find('.mat-mdc-dialog-surface')?.getBoundingClientRect() as DOMRect;
    expect(pane.left).toBeGreaterThan(start.left);
    expect(pane.right).toBeLessThanOrEqual(window.innerWidth + 1);
    expect(pane.bottom).toBeLessThanOrEqual(window.innerHeight + 1);
  });
});
