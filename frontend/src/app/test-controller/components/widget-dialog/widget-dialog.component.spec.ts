import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CustomtextService } from '@shared/shared.module';
import { WidgetDialogComponent } from './widget-dialog.component';

describe('Widget window interactions', () => {
  const dialogLimits = { maxWidth: '95vw', maxHeight: '95vh' };
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
      ...dialogLimits, panelClass: 'widget-dialog'
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

  async function waitFor(condition: () => boolean): Promise<void> {
    const deadline = performance.now() + 3000;
    while (!condition()) {
      if (performance.now() > deadline) throw new Error('Widget did not become ready');
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
  }

  // Convert widget-document coordinates to screen coordinates. An iframe's
  // inner DOM bounds alone do not include scaling applied by its parent.
  function visibleBounds(iframe: HTMLIFrameElement, selector: string) {
    const element = iframe.contentDocument?.querySelector(selector);
    if (!element) throw new Error(`Missing widget element ${selector}`);
    const inner = element.getBoundingClientRect();
    const frame = iframe.getBoundingClientRect();
    const scaleX = frame.width / iframe.offsetWidth;
    const scaleY = frame.height / iframe.offsetHeight;
    return {
      left: frame.left + inner.left * scaleX, top: frame.top + inner.top * scaleY,
      right: frame.left + inner.right * scaleX, bottom: frame.top + inner.bottom * scaleY,
      width: inner.width * scaleX, height: inner.height * scaleY
    };
  }

  type Bounds = { left: number; top: number; right: number; bottom: number };

  function expectContained(bounds: Bounds, container: Bounds): void {
    expect(bounds.left).toBeGreaterThanOrEqual(container.left - 1);
    expect(bounds.top).toBeGreaterThanOrEqual(container.top - 1);
    expect(bounds.right).toBeLessThanOrEqual(container.right + 1);
    expect(bounds.bottom).toBeLessThanOrEqual(container.bottom + 1);
  }

  function expectWithinViewport(bounds: Bounds): void {
    expectContained(bounds, { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight });
  }

  function expectContentFits(iframe: HTMLIFrameElement, selector: string): void {
    const frame = iframe.getBoundingClientRect();
    const dialogBounds = target('[role="dialog"]').getBoundingClientRect();
    const content = visibleBounds(iframe, selector);
    expectContained(content, frame);
    expectContained(frame, dialogBounds);
    expectWithinViewport(dialogBounds);
    // Hit-test the content's edges to detect clipping by intermediate hosts.
    // Edge midpoints avoid the dialog's deliberately rounded corners.
    const inset = Math.min(1, content.width / 4, content.height / 4);
    const middleX = (content.left + content.right) / 2;
    const middleY = (content.top + content.bottom) / 2;
    for (const [x, y] of [
      [middleX, content.top + inset], [middleX, content.bottom - inset],
      [content.left + inset, middleY], [content.right - inset, middleY]
    ]) {
      expect(document.elementFromPoint(x, y) === iframe).withContext(`Content is clipped at ${x}, ${y}`).toBeTrue();
    }
  }

  // Measure the limits supplied to the dialog using browser CSS layout, without
  // importing production constants or reproducing the widget sizing formula.
  function availableDialogSize(): { width: number; height: number } {
    const reference = document.createElement('div');
    reference.style.cssText = `position: fixed; visibility: hidden;
      width: ${dialogLimits.maxWidth}; height: ${dialogLimits.maxHeight};`;
    document.body.appendChild(reference);
    const { width, height } = reference.getBoundingClientRect();
    reference.remove();
    return { width, height };
  }

  function expectUsesAvailableSpace(iframe: HTMLIFrameElement, selector: string): void {
    const available = availableDialogSize();
    const actual = target('[role="dialog"]').getBoundingClientRect();
    const content = visibleBounds(iframe, selector);
    // Oversized content must fill the available width or reach the window's
    // bottom at the height limit, rather than shrink into unused space.
    const fillsWidth = Math.abs(content.width - available.width) <= 2;
    const fillsHeight = Math.abs(actual.height - available.height) <= 2 &&
      Math.abs(content.bottom - actual.bottom) <= 2;
    expect(fillsWidth || fillsHeight).toBeTrue();
  }

  function isVisible(element: HTMLElement): boolean {
    const bounds = element.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return false;
    for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    }
    return true;
  }

  async function loadDocument(html: string, preferredWidth?: number): Promise<HTMLIFrameElement> {
    ref.componentInstance.start(html, () => {});
    const iframe = target('iframe') as HTMLIFrameElement;
    await new Promise<void>(resolve => iframe.addEventListener('load', () => resolve(), { once: true }));
    ref.componentInstance.showRunning('Test widget', preferredWidth);
    ref.componentRef?.changeDetectorRef.detectChanges();
    await waitFor(() => isVisible(iframe));
    return iframe;
  }

  async function loadWidget(contentWidth = 550, contentHeight = 240,
                            preferredWidth?: number): Promise<HTMLIFrameElement> {
    return loadDocument(`<!doctype html><html><head><style>
      html, body { margin: 0; width: 100%; height: 100%; }
      main { width: ${contentWidth}px; height: ${contentHeight}px; background: green; }
    </style></head><body><main>Widget</main></body></html>`, preferredWidth);
  }

  // Like the molecule editor: a responsive canvas with an SVG viewBox that
  // follows its host, plus controls whose size must not depend on canvas width.
  const responsiveWidget = (height = 700) => `<!doctype html><html><head><style>
    html, body { margin: 0; height: 100%; }
    main { position: relative; min-height: ${height}px; }
    .canvas { position: absolute; inset: 0; }
    svg { display: block; width: 100%; height: 100%; }
    button { position: absolute; top: 0; left: 0; width: 48px; height: 48px; }
  </style></head><body><main><div class="canvas"><svg></svg></div><button>H</button></main>
    <script>
      new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        document.querySelector('svg').setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      }).observe(document.querySelector('.canvas'));
    </script>
  </body></html>`;

  for (const initialWidth of ['200px', '90vw']) {
    it(`keeps responsive controls at natural size after opening a ${initialWidth} dialog`, async () => {
      // The fixture workspace fits even in the small headless test browser.
      ref.updateSize(initialWidth, '240px');
      const iframe = await loadDocument(responsiveWidget(120), 320);
      const control = visibleBounds(iframe, 'button');
      expect(control.width).toBeCloseTo(48, 0);
      expect(control.height).toBeCloseTo(48, 0);
      expect(visibleBounds(iframe, 'svg').width).toBeCloseTo(320, 0);
      expectWithinViewport(control);
      expectContentFits(iframe, 'svg');
    });
  }

  it('narrows the responsive workspace without shrinking controls when the preferred width cannot fit', async () => {
    const iframe = await loadDocument(responsiveWidget(120), window.innerWidth * 2);
    const control = visibleBounds(iframe, 'button');
    expect(control.width).toBeCloseTo(48, 0);
    expect(control.height).toBeCloseTo(48, 0);
    expectWithinViewport(control);
    expect(visibleBounds(iframe, 'svg').width).toBeCloseTo(availableDialogSize().width, 0);
    expectContentFits(iframe, 'svg');
  });

  it('shrinks responsive controls proportionally when the widget is too tall', async () => {
    const workspaceWidth = window.innerWidth * 2;
    const iframe = await loadDocument(responsiveWidget(window.innerHeight * 2), workspaceWidth);
    const control = visibleBounds(iframe, 'button');
    expect(control.width).toBeGreaterThan(0);
    expect(control.width).toBeLessThan(48);
    expect(control.width).toBeCloseTo(control.height, 0);
    expectWithinViewport(control);
    expectContentFits(iframe, 'svg');
    expectUsesAvailableSpace(iframe, 'svg');
  });

  it('fits fixed content that is wider than the screen even when a preferred width is supplied', async () => {
    const contentWidth = window.innerWidth * 2;
    const iframe = await loadWidget(contentWidth, 80, 320);
    const content = visibleBounds(iframe, 'main');
    expect(content.width).toBeGreaterThan(0);
    expect(content.width).toBeLessThan(contentWidth);
    expect(content.width / content.height).toBeCloseTo(contentWidth / 80);
    expectContentFits(iframe, 'main');
    expectUsesAvailableSpace(iframe, 'main');
  });

  it('keeps fixed content at its natural visible size when there is enough space', async () => {
    const iframe = await loadWidget(120, 80, 300);
    const content = visibleBounds(iframe, 'main');
    expect(content.width).toBeCloseTo(120, 0);
    expect(content.height).toBeCloseTo(80, 0);
    expectContentFits(iframe, 'main');
  });

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

  it('allows closing the loading card before the widget starts', async () => {
    target('.preparation button').click();
    await waitFor(() => document.querySelector('[role="dialog"]') === null);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  for (const [width, height] of [[550, 2000], [900, 1200], [3000, 400], [350, 200]]) {
    it(`fits ${width}×${height} content on opening without scrolling or enlarging it`, async () => {
      const iframe = await loadWidget(width, height);
      const content = visibleBounds(iframe, 'main');
      expect(content.width).toBeGreaterThan(0);
      expect(content.height).toBeGreaterThan(0);
      expect(content.width).toBeLessThanOrEqual(width + 1);
      expect(content.height).toBeLessThanOrEqual(height + 1);
      expect(content.width / content.height).toBeCloseTo(width / height);
      expectContentFits(iframe, 'main');
      const available = availableDialogSize();
      if (width > available.width || height > available.height) {
        expectUsesAvailableSpace(iframe, 'main');
      } else {
        expect(content.width).toBeCloseTo(width, 0);
        expect(content.height).toBeCloseTo(height, 0);
      }
      const doc = iframe.contentDocument;
      if (!doc) throw new Error('Missing widget document');
      expect(doc.documentElement.scrollWidth).toBe(doc.documentElement.clientWidth);
      expect(doc.documentElement.scrollHeight).toBe(doc.documentElement.clientHeight);
    });
  }
});
