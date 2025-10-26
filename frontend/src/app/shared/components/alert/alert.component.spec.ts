import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { AlertComponent } from './alert.component';

describe('AlertComponent', () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;
  let returnedTexts: string[] = [];

  const changeAttributeText = (value: string) => {
    const previousValue = component.text;
    component.text = value;
    if (previousValue !== value) {
      component.ngOnChanges();
    }
  };

  const changeAttributeCustomtext = (value: string) => {
    const previousValue = component.customtext;
    component.customtext = value;
    if (previousValue !== value) {
      component.ngOnChanges();
    }
  };

  const changeAttributeReplacements = (value: string[]) => {
    const previousValue = component.replacements;
    component.replacements = value;
    if (JSON.stringify(previousValue) !== JSON.stringify(value)) {
      component.ngOnChanges();
    }
  };

  const updateCustomText = (key: string, value: string): void => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    component['cts']['addCustomTexts']({ [key]: value });
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatIconModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
    returnedTexts = [];
    component.displayText$.subscribe(text => returnedTexts.push(text));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update on input change', () => {
    changeAttributeText('A');
    changeAttributeText('B');
    changeAttributeText('B');
    changeAttributeText('C');
    expect(returnedTexts).toEqual(['A', 'B', 'C']);
  });

  it('should highlight ticks', () => {
    changeAttributeText('A `in ticks` A');
    changeAttributeText('B');
    changeAttributeText('C `in ticks` C');
    expect(returnedTexts).toEqual([
      'A <span class=\'highlight\'>in ticks</span> A',
      'B',
      'C <span class=\'highlight\'>in ticks</span> C'
    ]);
  });

  it('should use and update the customtext if given', () => {
    changeAttributeText('text value');

    updateCustomText('customtext key', 'customtext value');
    changeAttributeCustomtext('customtext key');

    changeAttributeText('text value change is ignored as long as customtext is given and an existing key');
    updateCustomText('customtext key', 'customtext value updated');

    changeAttributeCustomtext('missing key');

    updateCustomText('missing key', 'missing key got a value');

    changeAttributeText('text value is used as defaultvalue for customtext');
    updateCustomText('empty key', '');
    changeAttributeCustomtext('empty key');

    updateCustomText('customtext key', 'replacement: %s');
    changeAttributeCustomtext('customtext key');

    changeAttributeReplacements(['something']);

    changeAttributeReplacements(['something else']);

    updateCustomText('customtext key', 'replacement in ticks: `%s`');

    expect(returnedTexts).toEqual([
      'text value',
      'customtext value',
      'customtext value',
      'customtext value updated',
      'text value change is ignored as long as customtext is given and an existing key',
      'missing key got a value',
      'missing key got a value',
      'text value is used as defaultvalue for customtext',
      'replacement: %s',
      'replacement: something',
      'replacement: something else',
      'replacement in ticks: <span class=\'highlight\'>something else</span>'
    ]);
  });
});
