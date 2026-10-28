import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CustomtextService } from '@shared/shared.module';
import { WidgetDialogComponent } from './widget-dialog.component';
import { WidgetContentSize } from '../../interfaces/widget.interfaces';

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
      minWidth: 0, minHeight: 0,
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
    for (let frame = 0; frame < 5; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
  }

  async function loadWidget(contentWidth = 550, contentHeight = 240,
                            contentSize?: WidgetContentSize,
                            preferredWidth?: number): Promise<HTMLIFrameElement> {
    ref.componentInstance.start(`<!doctype html><html><head><style>
      html, body { margin: 0; width: 100%; height: 100%; }
      main { width: ${contentWidth}px; height: ${contentHeight}px; background: green; }
    </style></head><body><main>Widget</main></body></html>`, () => {});
    const iframe = target('iframe') as HTMLIFrameElement;
    await new Promise<void>(resolve => iframe.addEventListener('load', () => resolve(), { once: true }));
    ref.componentInstance.showRunning('Test widget', contentSize, preferredWidth);
    ref.componentRef?.changeDetectorRef.detectChanges();
    await nextLayout();
    return iframe;
  }

  function pane(): HTMLElement {
    const element = document.querySelector<HTMLElement>('.cdk-overlay-pane.widget-dialog');
    if (!element) throw new Error('Missing widget pane');
    return element;
  }

  function expectFrameFillsWindow(iframe: HTMLIFrameElement): void {
    const frame = iframe.getBoundingClientRect();
    const host = target('.frame-host').getBoundingClientRect();
    expect(frame.width).toBeCloseTo(host.width, 0);
    expect(frame.height).toBeCloseTo(host.height, 0);
    expect(iframe.style.transform).toBe('');
  }

  it('uses custom text for loading, errors, and window controls and follows text updates', () => {
    const texts = TestBed.inject(CustomtextService);
    texts.addCustomTexts({
      booklet_widgetLoading: 'Loading tool', booklet_widgetStarting: 'Starting tool',
      booklet_widgetClose: 'Close tool',
      booklet_widgetStartupError: 'Tool did not start', booklet_widgetDownloadError: 'Tool did not load'
    });
    ref.componentRef?.changeDetectorRef.detectChanges();
    expect(target('.preparation p').textContent).toContain('Loading tool');
    expect(target('.preparation button').getAttribute('aria-label')).toBe('Close tool');
    ref.componentInstance.start('<html></html>', () => {});
    ref.componentRef?.changeDetectorRef.detectChanges();
    expect(target('.preparation p').textContent).toContain('Starting tool');
    ref.componentInstance.showStartupError();
    ref.componentRef?.changeDetectorRef.detectChanges();
    expect(target('.status').textContent).toContain('Tool did not start');
    texts.addCustomTexts({ booklet_widgetStartupError: 'Please close this tool' });
    ref.componentRef?.changeDetectorRef.detectChanges();
    expect(target('.status').textContent).toContain('Please close this tool');
    ref.componentInstance.showDownloadError();
    ref.componentRef?.changeDetectorRef.detectChanges();
    expect(target('.status').textContent).toContain('Tool did not load');
  });

  it('shows only the loading card until the running widget has its initial size', async () => {
    expect(getComputedStyle(target('.frame-host')).visibility).toBe('hidden');
    expect(getComputedStyle(target('.preparation')).visibility).toBe('visible');
    expect(getComputedStyle(target('.mat-mdc-dialog-surface')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    ref.componentInstance.start('<html><body style="margin:0"><main ' +
      'style="width:350px;height:200px">Widget</main></body></html>', () => {});
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
    expect(ref.componentInstance.windowBounds.width).toBe(350);
    expect(target('.frame-host').clientHeight).toBe(200);
    expect(getComputedStyle(target('.frame-host')).visibility).toBe('visible');
    expect(document.querySelector('.widget-dialog .preparation')).toBeNull();
    expect(getComputedStyle(target('.mat-mdc-dialog-surface')).backgroundColor).toBe('rgb(255, 255, 255)');
  });

  for (const contentSize of [undefined, { width: 500, height: 250 }]) {
    it(`waits for widget fonts with ${contentSize ? 'supplied' : 'measured'} dimensions`, async () => {
      ref.componentInstance.start('<html><body>Widget</body></html>', () => {});
      const pending = target('iframe') as HTMLIFrameElement;
      await new Promise<void>(resolve => pending.addEventListener('load', () => resolve(), { once: true }));
      const fonts = pending.contentDocument?.fonts;
      if (!fonts) throw new Error('Widget fonts are missing');
      let finishFonts!: () => void;
      const ready = new Promise<FontFaceSet>((resolve) => {
        finishFonts = () => resolve(fonts);
      });
      spyOnProperty(fonts, 'ready', 'get').and.returnValue(ready);
      ref.componentInstance.showRunning('Test widget', contentSize);
      ref.componentRef?.changeDetectorRef.detectChanges();
      await nextLayout();
      expect(ref.componentInstance.layoutReady()).toBeFalse();
      finishFonts();
      await nextLayout();
      expect(ref.componentInstance.layoutReady()).toBeTrue();
    });
  }

  for (const failure of ['showDownloadError', 'showStartupError', 'showUnavailable'] as const) {
    it(`reveals ${failure} without waiting for widget layout`, () => {
      if (failure === 'showUnavailable') ref.componentInstance.showUnavailable('Resource unavailable');
      else ref.componentInstance[failure]();
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

  it('snugs both initial dimensions to content without scaling it', async () => {
    const iframe = await loadWidget();
    expect(ref.componentInstance.windowBounds.width).toBe(550);
    expect(target('.frame-host').clientHeight).toBe(240);
    expectFrameFillsWindow(iframe);
    expect(iframe.contentDocument?.querySelector('main')?.getBoundingClientRect().width).toBe(550);
  });

  it('derives the height from the preferred width', async () => {
    const iframe = await loadWidget(850, 650, undefined, 400);
    const host = target('.frame-host');
    expect(host.clientWidth).toBe(400);
    expect(host.clientHeight).toBeCloseTo(650 * 400 / 850, 0);
    expect(iframe.style.width).toBe('850px');
    expect(iframe.style.height).toBe('650px');
    const frame = iframe.getBoundingClientRect();
    expect(frame.width).toBeCloseTo(400, 0);
    expect(frame.height).toBeCloseTo(650 * 400 / 850, 0);
  });

  for (const dimensions of [{ width: 2000, height: 300 }, { width: 300, height: 2000 }]) {
    it(`hugs ${dimensions.width}×${dimensions.height} content within the screen at a preferred width`, async () => {
      const iframe = await loadWidget(dimensions.width, dimensions.height, undefined, 1100);
      const frame = iframe.getBoundingClientRect();
      const host = target('.frame-host');
      expect(Math.abs(host.clientWidth - frame.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(host.clientHeight - frame.height)).toBeLessThanOrEqual(1);
      expect(frame.width / frame.height).toBeCloseTo(dimensions.width / dimensions.height);
      const header = target('header').getBoundingClientRect();
      expect(header.height).toBe(48);
      expect(Math.abs(ref.componentInstance.windowBounds.height - frame.height - header.height))
        .toBeLessThanOrEqual(1);
      expect(ref.componentInstance.windowBounds.width).toBeLessThanOrEqual(Math.ceil(innerWidth * 0.95));
      expect(ref.componentInstance.windowBounds.height).toBeLessThanOrEqual(Math.ceil(innerHeight * 0.95));
    });
  }

  for (const contentSize of [{ width: 500, height: 250 }, { width: 900, height: 1200 }]) {
    it(`fits supplied ${contentSize.width}×${contentSize.height} dimensions instead of measured content`, async () => {
      const iframe = await loadWidget(350, 200, contentSize);
      expect(iframe.style.width).toBe(`${contentSize.width}px`);
      expect(iframe.style.height).toBe(`${contentSize.height}px`);
      const frame = iframe.getBoundingClientRect();
      const host = target('.frame-host').getBoundingClientRect();
      expect(frame.width / frame.height).toBeCloseTo(contentSize.width / contentSize.height);
      expect(frame.width).toBeLessThanOrEqual(host.width + 1);
      expect(frame.height).toBeLessThanOrEqual(host.height + 1);
      expect(host.width).toBeCloseTo(Math.ceil(frame.width), 0);
    });
  }

  for (const contentSize of [
    { width: 0, height: 200 }, { width: 350, height: -1 },
    { width: NaN, height: 200 }, { width: 350, height: Infinity }
  ]) {
    it(`rejects invalid supplied dimensions ${contentSize.width}×${contentSize.height}`, () => {
      expect(() => ref.componentInstance.showRunning('Test widget', contentSize))
        .toThrowError('Widget content dimensions must be positive finite numbers');
      expect(ref.componentInstance.layoutReady()).toBeFalse();
    });
  }

  it('limits large content to the viewport and fits it without document scrolling', async () => {
    const iframe = await loadWidget(3000, 2000);
    const bounds = ref.componentInstance.windowBounds;
    expect(bounds.width).toBeLessThanOrEqual(Math.ceil(innerWidth * 0.95));
    expect(bounds.height).toBeCloseTo(innerHeight * 0.95, 0);
    const frame = iframe.getBoundingClientRect();
    expect(frame.width).toBeLessThanOrEqual(target('.frame-host').clientWidth + 1);
    expect(frame.height).toBeLessThanOrEqual(target('.frame-host').clientHeight + 1);
    const doc = iframe.contentDocument;
    if (!doc) throw new Error('Missing widget document');
    expect(doc.documentElement.scrollWidth).toBe(doc.documentElement.clientWidth);
    expect(doc.documentElement.scrollHeight).toBe(doc.documentElement.clientHeight);
    expect(doc.documentElement.style.overflow).toBe('');
  });

  for (const [width, height] of [[550, 2000], [900, 1200], [3000, 400], [350, 200]]) {
    it(`fits ${width}×${height} content on opening without scrolling or enlarging it`, async () => {
      const iframe = await loadWidget(width, height);
      const frame = iframe.getBoundingClientRect();
      const host = target('.frame-host').getBoundingClientRect();
      expect(frame.width).toBeLessThanOrEqual(host.width + 1);
      expect(frame.height).toBeLessThanOrEqual(host.height + 1);
      expect(frame.width).toBeLessThanOrEqual(width);
      expect(frame.height).toBeLessThanOrEqual(height);
      expect(frame.width / frame.height).toBeCloseTo(width / height);
      expect(host.width).toBeCloseTo(Math.ceil(frame.width), 0);
      const doc = iframe.contentDocument;
      if (!doc) throw new Error('Missing widget document');
      expect(doc.documentElement.scrollWidth).toBe(doc.documentElement.clientWidth);
      expect(doc.documentElement.scrollHeight).toBe(doc.documentElement.clientHeight);
      expect(doc.querySelector('main')?.getBoundingClientRect().height).toBe(height);
    });
  }

  it('keeps the initial fitted content size when interacting', async () => {
    const iframe = await loadWidget(550, 2000);
    const initialFrame = iframe.getBoundingClientRect();
    const initialStyle = iframe.style.cssText;
    const doc = iframe.contentDocument;
    if (!doc) throw new Error('Missing widget document');
    doc.body.insertAdjacentHTML('beforeend', '<input aria-label="Calculation">');
    const input = doc.querySelector('input');
    if (!input) throw new Error('Missing widget input');
    for (const value of ['123', '456']) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await nextLayout();
      expect(iframe.style.cssText).toBe(initialStyle);
      expect(iframe.getBoundingClientRect().width).toBe(initialFrame.width);
      expect(iframe.getBoundingClientRect().height).toBe(initialFrame.height);
      expect(input.value).toBe(value);
    }
  });

  it('disables manual resizing while loading and running', async () => {
    expect(getComputedStyle(pane()).resize).toBe('none');
    const iframe = await loadWidget();
    expect(getComputedStyle(pane()).resize).toBe('none');
    expect(getComputedStyle(pane()).overflow).toBe('hidden');
    expect(document.querySelector('.widget-dialog .resize')).toBeNull();
    expectFrameFillsWindow(iframe);
  });

  it('does not remeasure content or resize the window when interacting', async () => {
    const iframe = await loadWidget();
    const initialFrame = iframe.getBoundingClientRect();
    const bounds = ref.componentInstance.windowBounds;
    const doc = iframe.contentDocument;
    if (!doc) throw new Error('Missing widget document');
    const mutations = jasmine.createSpy('host changed widget layout');
    const observer = new MutationObserver(mutations);
    observer.observe(iframe, { attributes: true });
    observer.observe(doc.documentElement, { attributes: true });
    observer.observe(doc.body, { attributes: true });
    doc.body.innerHTML = '<button>Expand</button><input><main style="width:1200px;height:1000px"></main>';
    const button = doc.querySelector('button');
    const input = doc.querySelector('input');
    if (!button || !input) throw new Error('Missing widget controls');
    button.addEventListener('click', () => {
      button.textContent = 'Expanded';
    });
    button.click();
    input.value = '123';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await nextLayout();
    await nextLayout();
    observer.disconnect();
    expect(mutations).not.toHaveBeenCalled();
    expect(ref.componentInstance.windowBounds).toEqual(bounds);
    expect(iframe.getBoundingClientRect().width).toBe(initialFrame.width);
    expect(iframe.getBoundingClientRect().height).toBe(initialFrame.height);
  });

  it('discards a pending initial measurement when the window closes', async () => {
    ref.componentInstance.start('<html><body>Widget</body></html>', () => {});
    const iframe = target('iframe') as HTMLIFrameElement;
    await new Promise<void>(resolve => iframe.addEventListener('load', () => resolve(), { once: true }));
    ref.componentInstance.showRunning('Widget');
    const updateSize = spyOn(ref, 'updateSize').and.callThrough();
    ref.close();
    await nextLayout();
    expect(updateSize).not.toHaveBeenCalled();
    expect(document.querySelector('.widget-dialog')).toBeNull();
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

  it('keeps the fitted content visible when dragging repeatedly', async () => {
    const iframe = await loadWidget();
    const fitted = ref.componentInstance.windowBounds;
    dragBy(20, 20);
    const moved = ref.componentInstance.windowBounds;
    expect(moved.left).toBeCloseTo(fitted.left + 20, 0);
    expect(moved.top).toBeCloseTo(fitted.top + 20, 0);
    dragBy(-20, -20);
    const draggedAgain = ref.componentInstance.windowBounds;
    expect(draggedAgain.left).toBeCloseTo(fitted.left, 0);
    expect(draggedAgain.top).toBeCloseTo(fitted.top, 0);
    expect(draggedAgain.width).toBe(fitted.width);
    expect(draggedAgain.height).toBe(fitted.height);
    expectFrameFillsWindow(iframe);
  });

  it('does not drag when pressing the close button', () => {
    const original = ref.componentInstance.windowBounds;
    mouse(target('header button[mat-dialog-close]'), 'mousedown', 300, 200);
    mouse(document, 'mousemove', 320, 220);
    mouse(document, 'mousemove', 340, 240);
    mouse(document, 'mouseup', 340, 240);
    expect(ref.componentInstance.windowBounds).toEqual(original);
  });
});
