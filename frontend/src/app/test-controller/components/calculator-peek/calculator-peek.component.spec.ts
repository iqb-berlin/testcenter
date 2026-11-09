import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CalculatorPeekComponent } from './calculator-peek.component';

describe('CalculatorPeekComponent', () => {
  const image = 'data:image/png;base64,AAAA';
  let fixture: ComponentFixture<CalculatorPeekComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalculatorPeekComponent, MatIconTestingModule]
    });
    fixture = TestBed.createComponent(CalculatorPeekComponent);
    fixture.componentRef.setInput('calculation', { latex: '2\\cdot3=6', image });
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('shows the calculation as image, described by its LaTeX', () => {
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Letzte Rechnung');
    const img = element.querySelector('img');
    expect(img?.getAttribute('src')).toBe(image);
    expect(img?.alt).toBe('2\\cdot3=6');
  });

  it('reports when the test taker closes it', () => {
    const closed = jasmine.createSpy('closed');
    fixture.componentInstance.closed.subscribe(closed);
    element.querySelector<HTMLButtonElement>('[data-cy="calculator-peek-close"]')?.click();

    expect(closed).toHaveBeenCalledTimes(1);
  });
});
