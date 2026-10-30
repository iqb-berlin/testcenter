import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CustomtextService } from '@shared/shared.module';
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

  async function nextLayout(): Promise<void> {
    for (let frame = 0; frame < 5; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
  }

  async function loadWidget(contentWidth = 550, contentHeight = 240,
                            preferredWidth?: number): Promise<HTMLIFrameElement> {
    ref.componentInstance.start(`<!doctype html><html><head><style>
      html, body { margin: 0; width: 100%; height: 100%; }
      main { width: ${contentWidth}px; height: ${contentHeight}px; background: green; }
    </style></head><body><main>Widget</main></body></html>`, () => {});
    const iframe = target('iframe') as HTMLIFrameElement;
    await new Promise<void>(resolve => iframe.addEventListener('load', () => resolve(), { once: true }));
    ref.componentInstance.showRunning('Test widget', preferredWidth);
    ref.componentRef?.changeDetectorRef.detectChanges();
    await nextLayout();
    return iframe;
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

  it('allows closing the loading card before the widget starts', async () => {
    target('.preparation button').click();
    await nextLayout();
    expect(document.querySelector('.widget-dialog')).toBeNull();
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
});
