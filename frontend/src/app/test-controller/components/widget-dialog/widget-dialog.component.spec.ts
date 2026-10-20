import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { WidgetDialogComponent } from './widget-dialog.component';

describe('Widget window interactions', () => {
  let dialog: MatDialog;
  let ref: MatDialogRef<WidgetDialogComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule, MatIconTestingModule],
      providers: [provideNoopAnimations()]
    });
    dialog = TestBed.inject(MatDialog);
    ref = dialog.open(WidgetDialogComponent, {
      data: { name: 'Test widget' }, width: '400px', height: '300px',
      maxWidth: '95vw', maxHeight: '95vh', panelClass: 'widget-dialog'
    });
    tick();
  }));

  afterEach(fakeAsync(() => {
    dialog.closeAll();
    tick();
  }));

  function target(selector: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(`.widget-dialog ${selector}`);
    if (!element) throw new Error(`Missing ${selector}`);
    return element;
  }

  function pointer(element: HTMLElement, type: string, x: number, y: number): void {
    element.dispatchEvent(new PointerEvent(type, {
      pointerId: 1, button: 0, clientX: x, clientY: y, bubbles: true
    }));
  }

  function mouse(element: HTMLElement | Document, type: string, x: number, y: number): void {
    element.dispatchEvent(new MouseEvent(type, {
      button: 0, buttons: type === 'mouseup' ? 0 : 1, detail: 1, clientX: x, clientY: y, bubbles: true
    }));
  }

  function dragBy(dx: number, dy: number): void {
    const title = target('h2');
    const rect = title.getBoundingClientRect();
    const x = rect.left + 20;
    const y = rect.top + 10;
    mouse(title, 'mousedown', x, y);
    // CDK starts dragging after its movement threshold, then applies subsequent moves.
    mouse(document, 'mousemove', x + 6, y + 6);
    mouse(document, 'mousemove', x + dx, y + dy);
    mouse(document, 'mouseup', x + dx, y + dy);
  }

  async function nextLayout(): Promise<void> {
    // ResizeObserver schedules fitting in the next frame; inspect the resulting layout afterwards.
    for (let frame = 0; frame < 3; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
  }

  async function loadWidget(contentWidth = 1024, contentHeight = 600): Promise<HTMLIFrameElement> {
    ref.componentInstance.start(`<!doctype html><html><head><style>
      html, body { margin: 0; width: 100%; height: 100%; }
      main { width: ${contentWidth}px; height: ${contentHeight}px; background: green; }
    </style></head><body><main>Widget</main></body></html>`, () => {});
    const iframe = target('iframe') as HTMLIFrameElement;
    await new Promise<void>(resolve => iframe.addEventListener('load', () => resolve(), { once: true }));
    ref.componentInstance.showRunning('Test widget');
    ref.componentRef?.changeDetectorRef.detectChanges();
    await nextLayout();
    return iframe;
  }

  function expectFitted(iframe: HTMLIFrameElement, contentWidth = 1024, contentHeight = 600): void {
    const host = target('.frame-host');
    const frameBounds = iframe.getBoundingClientRect();
    const hostBounds = host.getBoundingClientRect();
    expect(frameBounds.width).toBeLessThanOrEqual(host.clientWidth + 0.5);
    expect(frameBounds.height).toBeLessThanOrEqual(host.clientHeight + 0.5);
    expect(frameBounds.width / frameBounds.height).toBeCloseTo(contentWidth / contentHeight);
    expect(frameBounds.left).toBeCloseTo(hostBounds.left, 0);
    expect(frameBounds.top).toBeCloseTo(hostBounds.top, 0);
    expect(host.scrollWidth).toBe(host.clientWidth);
    expect(host.scrollHeight).toBe(host.clientHeight);
    const doc = iframe.contentDocument;
    if (!doc) throw new Error('Widget document is missing');
    expect(doc.documentElement.clientWidth).toBe(contentWidth);
    expect(doc.documentElement.clientHeight).toBe(contentHeight);
    expect(doc.documentElement.scrollWidth).toBe(doc.documentElement.clientWidth);
    expect(doc.documentElement.scrollHeight).toBe(doc.documentElement.clientHeight);
    const transform = new DOMMatrixReadOnly(iframe.style.transform);
    expect(transform.a).toBeCloseTo(transform.d);
    expect(transform.a).toBeLessThanOrEqual(1);
  }

  it('shows only the loading card until the running widget has a stable fitted size', async () => {
    expect(getComputedStyle(target('.frame-host')).visibility).toBe('hidden');
    expect(getComputedStyle(target('.preparation')).visibility).toBe('visible');
    expect(getComputedStyle(target('.mat-mdc-dialog-surface')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    ref.componentInstance.start('<html><body style="margin:0"><main ' +
      'style="width:300px;height:600px">Widget</main></body></html>', () => {});
    const iframe = target('iframe') as HTMLIFrameElement;
    await new Promise<void>(resolve => iframe.addEventListener('load', () => resolve(), { once: true }));
    await nextLayout();
    expect(ref.componentInstance.layoutReady()).toBeFalse();
    expect(ref.componentInstance.windowBounds.width).toBe(400);
    ref.componentInstance.showRunning('Test widget');
    ref.componentRef?.changeDetectorRef.detectChanges();
    expect(ref.componentInstance.layoutReady()).toBeFalse();
    await nextLayout();
    ref.componentRef?.changeDetectorRef.detectChanges();
    expect(ref.componentInstance.layoutReady()).toBeTrue();
    expect(ref.componentInstance.windowBounds.width).toBe(320);
    expect(getComputedStyle(target('.frame-host')).visibility).toBe('visible');
    expect(document.querySelector('.widget-dialog .preparation')).toBeNull();
    expect(getComputedStyle(target('.mat-mdc-dialog-surface')).backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('waits for widget fonts before revealing the fitted modal', async () => {
    ref.componentInstance.start('<html><body>Widget</body></html>', () => {});
    const pending = target('iframe') as HTMLIFrameElement;
    await new Promise<void>(resolve => pending.addEventListener('load', () => resolve(), { once: true }));
    const fonts = pending.contentDocument?.fonts;
    if (!fonts) throw new Error('Widget fonts are missing');
    const status = spyOnProperty(fonts, 'status', 'get').and.returnValue('loading');
    ref.componentInstance.showRunning('Test widget');
    ref.componentRef?.changeDetectorRef.detectChanges();
    await nextLayout();
    expect(ref.componentInstance.layoutReady()).toBeFalse();
    status.and.returnValue('loaded');
    fonts.dispatchEvent(new Event('loadingdone'));
    await nextLayout();
    expect(ref.componentInstance.layoutReady()).toBeTrue();
  });

  for (const failure of ['showDownloadError', 'showStartupError', 'showMissingCalculator'] as const) {
    it(`reveals ${failure} without waiting for widget layout`, () => {
      ref.componentInstance[failure]();
      ref.componentRef?.changeDetectorRef.detectChanges();
      expect(ref.componentInstance.layoutReady()).toBeTrue();
      expect(getComputedStyle(target('.status')).display).not.toBe('none');
      expect(document.querySelector('.widget-dialog .preparation')).toBeNull();
    });
  }

  it('allows closing the loading card before the widget starts', async () => {
    target('.preparation button').click();
    await nextLayout();
    expect(document.querySelector('.widget-dialog')).toBeNull();
  });

  it('fits the full widget in portrait and landscape windows after resizing', async () => {
    const iframe = await loadWidget();
    expectFitted(iframe);
    expect(iframe.getBoundingClientRect().width).toBeCloseTo(target('.frame-host').clientWidth, 0);
    expect(iframe.contentDocument?.documentElement.clientWidth).toBe(1024);
    ref.updateSize('700px', '240px');
    await nextLayout();
    expectFitted(iframe);
    expect(iframe.getBoundingClientRect().height).toBeCloseTo(target('.frame-host').clientHeight, 0);
    expect(iframe.contentDocument?.documentElement.clientHeight).toBe(600);
    ref.updateSize('320px', '400px');
    await nextLayout();
    expectFitted(iframe);
    expect(iframe.contentDocument?.documentElement.clientWidth).toBe(1024);
  });

  it('uses the full modal content area beyond 1024 by 600 pixels', async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1600);
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(1000);
    ref.close();
    await nextLayout();
    ref = dialog.open(WidgetDialogComponent, {
      data: { name: 'Test widget' }, width: '1280px', height: '800px',
      maxWidth: '1600px', maxHeight: '1000px', panelClass: 'widget-dialog'
    });
    await nextLayout();
    const pane = target('tc-widget-dialog').closest<HTMLElement>('.cdk-overlay-pane');
    if (!pane) throw new Error('Dialog pane is missing');
    pane.style.flexShrink = '0';
    const iframe = await loadWidget(1500, 1000);
    const host = target('.frame-host');
    expectFitted(iframe, 1500, 1000);
    expect(iframe.getBoundingClientRect().width).toBeCloseTo(host.clientWidth, 0);
    expect(iframe.getBoundingClientRect().height).toBeCloseTo(host.clientHeight, 0);
    expect(iframe.getBoundingClientRect().width).toBeGreaterThan(1024);
    expect(iframe.getBoundingClientRect().height).toBeGreaterThan(600);
  });

  it('fits the modal width to the scaled width of a narrow widget', async () => {
    ref.updateSize('700px', '500px');
    const iframe = await loadWidget(550, 600);
    expectFitted(iframe, 550, 600);
    const contentWidth = iframe.getBoundingClientRect().width;
    expect(ref.componentInstance.windowBounds.width).toBeLessThanOrEqual(Math.ceil(contentWidth) + 1);
    expect(ref.componentInstance.windowBounds.width).toBeLessThan(550);
  });

  it('fits content that is wider and taller than the starting viewport', async () => {
    const iframe = await loadWidget(1400, 1100);
    expectFitted(iframe, 1400, 1100);
    const content = iframe.contentDocument?.querySelector('main');
    expect(content?.getBoundingClientRect().bottom).toBe(1100);
    expect(iframe.getBoundingClientRect().height).toBeCloseTo(target('.frame-host').clientHeight, 0);
  });

  it('remeasures growing content and restores its scale when the content shrinks', async () => {
    const iframe = await loadWidget();
    const originalWidth = ref.componentInstance.windowBounds.width;
    const content = iframe.contentDocument?.querySelector('main');
    if (!content) throw new Error('Widget content is missing');
    content.style.height = '1200px';
    await nextLayout();
    expectFitted(iframe, 1024, 1200);
    content.style.height = '600px';
    await nextLayout();
    expectFitted(iframe);
    expect(ref.componentInstance.windowBounds.width).toBe(originalWidth);
    // Our own layout changes must settle rather than trigger repeated measurements.
    const changed = jasmine.createSpy('iframe style changed');
    const observer = new MutationObserver(changed);
    observer.observe(iframe, { attributes: true, attributeFilter: ['style'] });
    await nextLayout();
    await nextLayout();
    observer.disconnect();
    expect(changed).not.toHaveBeenCalled();
  });

  it('includes minimum-size content clipped by a nested widget container', async () => {
    const iframe = await loadWidget();
    const availableWidth = target('.frame-host').clientWidth;
    const doc = iframe.contentDocument;
    if (!doc) throw new Error('Widget document is missing');
    doc.body.innerHTML = '<div style="position:relative;height:100%;overflow:hidden">' +
      '<main style="position:relative;width:100%;height:100%;min-height:720px">' +
      '<button style="position:absolute;right:0;bottom:0">Editor control</button></main>' +
      '<aside style="visibility:hidden;position:absolute;left:100%;width:2000px;height:1800px">' +
      'Closed element picker</aside></div>';
    await nextLayout();
    expectFitted(iframe, availableWidth, 720);
    expect(doc.querySelector('main')?.getBoundingClientRect().height).toBe(720);
  });

  it('stops observing the frame when startup fails or the dialog closes', async () => {
    await loadWidget();
    const disconnect = spyOn(ResizeObserver.prototype, 'disconnect').and.callThrough();
    ref.componentInstance.showStartupError();
    expect(disconnect).toHaveBeenCalledTimes(2);
    expect(target('.frame-host').querySelector('iframe')).toBeNull();
    await loadWidget();
    disconnect.calls.reset();
    ref.close();
    await nextLayout();
    expect(disconnect).toHaveBeenCalledTimes(2);
  });

  it('moves by the title bar and stops moving after release', () => {
    const title = target('h2');
    const capture = spyOn(title, 'setPointerCapture');
    pointer(title, 'pointerdown', 200, 100);
    expect(capture).toHaveBeenCalledOnceWith(1);
    const original = ref.componentInstance.windowBounds;
    dragBy(20, 20);
    const moved = ref.componentInstance.windowBounds;
    expect(moved.left).toBeCloseTo(original.left + 20, 0);
    expect(moved.top).toBeCloseTo(original.top + 20, 0);
    expect(moved.width).toBeCloseTo(original.width, 0);
    expect(moved.height).toBeCloseTo(original.height, 0);
    mouse(document, 'mousemove', 250, 150);
    expect(ref.componentInstance.windowBounds).toEqual(moved);
  });

  it('resizes by the corner handle and enforces minimum and viewport bounds', () => {
    const handle = target('.resize');
    spyOn(handle, 'setPointerCapture');
    const original = ref.componentInstance.windowBounds;
    pointer(handle, 'pointerdown', 400, 300);
    pointer(handle, 'pointermove', 350, 270);
    const resized = ref.componentInstance.windowBounds;
    expect(resized.width).toBeCloseTo(original.width - 50, 0);
    expect(resized.height).toBeCloseTo(original.height - 30, 0);
    expect(resized.left).toBeCloseTo(original.left, 0);
    expect(resized.top).toBeCloseTo(original.top, 0);
    pointer(handle, 'pointermove', -10000, -10000);
    expect(ref.componentInstance.windowBounds.width).toBeCloseTo(Math.min(320, innerWidth * 0.95), 0);
    expect(ref.componentInstance.windowBounds.height).toBeCloseTo(Math.min(240, innerHeight * 0.95), 0);
    pointer(handle, 'pointermove', 10000, 10000);
    const maximum = ref.componentInstance.windowBounds;
    expect(maximum.width).toBeCloseTo(innerWidth * 0.95, 0);
    expect(maximum.height).toBeCloseTo(innerHeight * 0.95, 0);
    expect(maximum.left + maximum.width).toBeLessThanOrEqual(innerWidth + 1);
    expect(maximum.top + maximum.height).toBeLessThanOrEqual(innerHeight + 1);
    pointer(handle, 'pointerup', 10000, 10000);
  });

  it('fits the size and position to a smaller viewport', () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(360);
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(260);
    window.dispatchEvent(new Event('resize'));
    const bounds = ref.componentInstance.windowBounds;
    expect(bounds.width).toBeCloseTo(342, 0);
    expect(bounds.height).toBeCloseTo(247, 0);
    expect(bounds.left + bounds.width).toBeLessThanOrEqual(361);
    expect(bounds.top + bounds.height).toBeLessThanOrEqual(261);
  });

  it('keeps the window reachable when dragged beyond the viewport', () => {
    dragBy(-10000, -10000);
    // CDK rounds translations to whole pixels; centered overlays can start on half pixels.
    expect(ref.componentInstance.windowBounds.left).toBeGreaterThanOrEqual(0);
    expect(ref.componentInstance.windowBounds.left).toBeLessThanOrEqual(1);
    expect(ref.componentInstance.windowBounds.top).toBeGreaterThanOrEqual(0);
    expect(ref.componentInstance.windowBounds.top).toBeLessThanOrEqual(1);
    dragBy(10000, 10000);
    const bounds = ref.componentInstance.windowBounds;
    expect(bounds.left + bounds.width).toBeLessThanOrEqual(innerWidth + 1);
    expect(bounds.top + bounds.height).toBeLessThanOrEqual(innerHeight + 1);
  });

  it('preserves the dragged position when resizing and allows dragging again', () => {
    dragBy(20, 20);
    const moved = ref.componentInstance.windowBounds;
    const handle = target('.resize');
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    const resized = ref.componentInstance.windowBounds;
    expect(resized.left).toBeCloseTo(moved.left, 0);
    expect(resized.top).toBeCloseTo(moved.top, 0);
    expect(resized.width).toBeCloseTo(moved.width - 10, 0);
    dragBy(-20, -20);
    const draggedAgain = ref.componentInstance.windowBounds;
    expect(draggedAgain.left).toBeCloseTo(resized.left - 20, 0);
    expect(draggedAgain.top).toBeCloseTo(resized.top - 20, 0);
    expect(draggedAgain.width).toBeCloseTo(resized.width, 0);
  });

  it('stops resizing after pointer cancellation or lost capture', () => {
    const handle = target('.resize');
    spyOn(handle, 'setPointerCapture');
    for (const end of ['pointercancel', 'lostpointercapture']) {
      pointer(handle, 'pointerdown', 400, 300);
      pointer(handle, 'pointermove', 390, 290);
      const resized = ref.componentInstance.windowBounds;
      pointer(handle, end, 390, 290);
      pointer(handle, 'pointermove', 350, 250);
      expect(ref.componentInstance.windowBounds).toEqual(resized);
    }
  });

  it('does not drag when pressing the close button or the resize handle', () => {
    const original = ref.componentInstance.windowBounds;
    for (const selector of ['button[mat-dialog-close]', '.resize']) {
      mouse(target(selector), 'mousedown', 300, 200);
      mouse(document, 'mousemove', 320, 220);
      mouse(document, 'mousemove', 340, 240);
      mouse(document, 'mouseup', 340, 240);
      expect(ref.componentInstance.windowBounds).toEqual(original);
    }
  });
});
