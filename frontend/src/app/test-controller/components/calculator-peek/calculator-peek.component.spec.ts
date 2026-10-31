import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CustomtextService } from '@shared/shared.module';
import { CalculatorPeekComponent } from './calculator-peek.component';

describe('CalculatorPeekComponent', () => {
  let fixture: ComponentFixture<CalculatorPeekComponent>;
  let host: HTMLElement;
  let boundary: HTMLDivElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CalculatorPeekComponent, MatIconTestingModule] });
    fixture = TestBed.createComponent(CalculatorPeekComponent);
    host = fixture.nativeElement as HTMLElement;
    boundary = document.createElement('div');
    boundary.style.cssText = 'position:relative;width:700px;height:500px';
    document.body.appendChild(boundary);
    boundary.appendChild(host);
  });
  afterEach(() => {
    fixture.destroy();
    boundary.remove();
  });

  function element<T extends HTMLElement>(selector: string): T {
    return host.querySelector<T>(selector)!;
  }
  function show(width = 180, formula = '1+2=3'): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = 40;
    fixture.componentRef.setInput('result', { image: canvas.toDataURL(), formula });
    fixture.detectChanges();
  }

  it('fits images at natural width and caps oversized images inside its boundary', async () => {
    for (const width of [180, 1400]) {
      show(width);
      const image = element<HTMLImageElement>('img');
      await image.decode();
      const bounds = element('.peek-viewport').getBoundingClientRect();
      const peek = element('[data-cy="calculator-peek"]').getBoundingClientRect();
      expect(peek.left).toBeGreaterThanOrEqual(bounds.left);
      expect(peek.right).toBeLessThanOrEqual(bounds.right);
      expect(image.getBoundingClientRect().width).toBeGreaterThan(0);
      if (width === 180) expect(image.getBoundingClientRect().width).toBeCloseTo(width, 0);
      else expect(image.getBoundingClientRect().width).toBeLessThan(width);
    }
  });

  it('uses custom labels and fallback text, preserving formulas and emitting close requests', () => {
    TestBed.inject(CustomtextService).addCustomTexts({
      booklet_calculatorResult: 'Latest calculation', booklet_calculatorResultClose: 'Close result'
    });
    show(180, '');
    expect(element('section').getAttribute('aria-label')).toBe('Latest calculation');
    expect(element<HTMLImageElement>('img').alt).toBe('Latest calculation');
    const closed = jasmine.createSpy('closed');
    fixture.componentInstance.closed.subscribe(closed);
    element<HTMLButtonElement>('[aria-label="Close result"]').click();
    expect(closed).toHaveBeenCalledTimes(1);
    show();
    expect(element<HTMLImageElement>('img').alt).toBe('1+2=3');
  });

  it('allows interaction outside the preview without stealing focus', () => {
    const trigger = document.createElement('button');
    boundary.appendChild(trigger);
    trigger.focus();
    show();
    expect(document.activeElement).toBe(trigger);
    const bounds = trigger.getBoundingClientRect();
    const target = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    expect(trigger.contains(target)).toBeTrue();
  });

  it('moves by its title bar and remains within the boundary after resizing', fakeAsync(() => {
    show();
    const peek = element('section');
    const handle = element('.handle');
    const initial = peek.getBoundingClientRect();
    const rect = handle.getBoundingClientRect();
    const x = rect.left + 10;
    const y = rect.top + 10;
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, buttons: 1, detail: 1, clientX: x, clientY: y }));
    for (const distance of [30, 80]) {
      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true, buttons: 1, clientX: x - distance, clientY: y + distance
      }));
      tick(20);
    }
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    tick();
    expect(peek.getBoundingClientRect().left).toBeLessThan(initial.left);
    expect(peek.getBoundingClientRect().top).toBeGreaterThan(initial.top);
    boundary.style.width = '350px';
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    const bounds = element('.peek-viewport').getBoundingClientRect();
    expect(peek.getBoundingClientRect().left).toBeGreaterThanOrEqual(bounds.left);
    expect(peek.getBoundingClientRect().right).toBeLessThanOrEqual(bounds.right);
  }));
});
