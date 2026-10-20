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
