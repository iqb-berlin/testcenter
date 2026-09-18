import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { UnitMenuComponent } from './unit-menu.component';
import { TestControllerService } from '../../services/test-controller.service';
import { CustomtextService } from '../../../shared/services/customtext/customtext.service';
import { CustomtextPipe } from '../../../shared/pipes/customtext/customtext.pipe';
import { TemplateContextDirective } from '../../../shared/directives/template-context.directive';
import { UnitInaccessiblePipe } from '../../pipes/unit-inaccessible.pipe';
import { NavigationState, Testlet, Unit } from '../../interfaces/test-controller.interfaces';
import { TestMode } from '../../../shared/shared.module';
import { getTestData } from '../../test/test-data';

const allDirectionsAllowed: NavigationState = {
  directions: { forward: 'yes', backward: 'yes' },
  targets: {
    next: null, previous: null, first: null, last: null, end: null
  }
};

describe('UnitMenuComponent', () => {
  let component: UnitMenuComponent;
  let fixture: ComponentFixture<UnitMenuComponent>;
  let tcs: {
    navigation$: BehaviorSubject<NavigationState>;
    booklet: { units: Testlet } | null;
    currentUnitSequenceId: number;
    testMode: TestMode;
    setUnitNavigationRequest: jasmine.Spy;
    terminateTest: jasmine.Spy;
    onStateOptionChanged: jasmine.Spy;
  };

  // One block holding two units; `inaccessible` makes the second one unreachable the way a
  // lockAfterLeaving restriction would.
  const buildBooklet = (inaccessible = false): { units: Testlet } => {
    const testData = getTestData();
    const block: Testlet = {
      ...testData.Testlets.root,
      locked: null,
      timerId: null,
      restrictions: {},
      children: []
    };
    const first: Unit = { ...testData.Units.u1, sequenceId: 1, parent: block };
    const second: Unit = {
      ...testData.Units.u1,
      id: 'u2',
      alias: 'u2',
      label: 'Unit-2',
      sequenceId: 2,
      parent: block,
      lockedAfterLeaving: inaccessible
    };
    block.children.push(first, second);
    return { units: block };
  };

  const entry = (label: string): HTMLElement =>
    fixture.nativeElement.querySelector(`[data-cy="unit-menu-unitbutton-${label}"]`);

  beforeEach(waitForAsync(() => {
    tcs = {
      navigation$: new BehaviorSubject<NavigationState>(allDirectionsAllowed),
      booklet: buildBooklet(),
      currentUnitSequenceId: 1,
      testMode: new TestMode('RUN-HOT-RESTART'),
      setUnitNavigationRequest: jasmine.createSpy('setUnitNavigationRequest'),
      terminateTest: jasmine.createSpy('terminateTest'),
      onStateOptionChanged: jasmine.createSpy('onStateOptionChanged')
    };

    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatSelectModule,
        MatTooltipModule,
        NoopAnimationsModule,
        CustomtextPipe,
        UnitInaccessiblePipe,
        TemplateContextDirective
      ],
      declarations: [UnitMenuComponent],
      providers: [
        { provide: TestControllerService, useValue: tcs },
        { provide: CustomtextService, useValue: { getCustomText$: () => of(''), getCustomText: () => '' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UnitMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('lists an entry for every unit of the booklet', () => {
    expect(entry('Unit-1')).toBeTruthy();
    expect(entry('Unit-2')).toBeTruthy();
  });

  it('requests navigation to the unit whose entry was clicked and closes the menu', () => {
    const closed = jasmine.createSpy('close');
    component.close.subscribe(closed);

    entry('Unit-2').click();

    expect(tcs.setUnitNavigationRequest).toHaveBeenCalledOnceWith('2');
    expect(closed).toHaveBeenCalled();
  });

  // Asserted on the rendered state rather than by clicking: what keeps a real pointer out is
  // `pointer-events: none`, which a programmatic click ignores.
  it('offers the entry of an unreachable unit as disabled', () => {
    tcs.booklet = buildBooklet(true);
    fixture.detectChanges();

    expect(entry('Unit-2').getAttribute('disabled')).toBe('true');
    expect(entry('Unit-1').getAttribute('disabled')).toBeNull();
  });
});
