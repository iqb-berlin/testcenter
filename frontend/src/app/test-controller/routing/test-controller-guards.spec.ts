import { Location } from '@angular/common';
import { provideLocationMocks, SpyLocation } from '@angular/common/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NavigationCancel, NavigationEnd, NavigationError, provideRouter, Router, Routes
} from '@angular/router';
import {
  BehaviorSubject, filter, firstValueFrom, of
} from 'rxjs';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { NavigationState, TestControllerState, Unit } from '../interfaces/test-controller.interfaces';
import { TestControllerService } from '../services/test-controller.service';
import { MessageService } from '../../shared/services/message.service';
import { getTestData } from '../test/test-data';
import { testControllerErrorPausedActivateGuard } from './test-controller-error-paused-activate.guard';
import { unitActivateGuard } from './unit-activate.guard';
import { unitDeactivateGuard } from './unit-deactivate.guard';
import { testControllerDeactivateGuard } from './test-controller-deactivate.guard';

@Component({ template: '' })
class RoutedComponent {}

// Without a router outlet, no route component gets created, but all guards run. The unit route
// names UnithostComponent because testControllerDeactivateGuard checks for it.
const routes: Routes = [
  { path: '', component: RoutedComponent, pathMatch: 'full' },
  { path: 'elsewhere', component: RoutedComponent },
  {
    path: 't/:t',
    component: RoutedComponent,
    canDeactivate: [testControllerDeactivateGuard],
    children: [
      { path: '', pathMatch: 'full', children: [] },
      { path: 'status', component: RoutedComponent },
      {
        path: 'u/:u',
        component: UnithostComponent,
        canActivate: [testControllerErrorPausedActivateGuard, unitActivateGuard],
        canDeactivate: [unitDeactivateGuard]
      }
    ]
  }
];

const { Units } = getTestData();
const accessibleUnit: Unit = Units.u1;
const lockedUnit: Unit = { ...Units.u1, sequenceId: 2, lockedAfterLeaving: true };
const unitsBySequenceId: Record<number, Unit> = {
  1: accessibleUnit,
  2: lockedUnit,
  3: { ...Units.u1, sequenceId: 3 },
  4: { ...Units.u1, sequenceId: 4 }
};

function createNavigationState(targets: Partial<NavigationState['targets']>): NavigationState {
  return {
    targets: {
      next: null, previous: null, first: null, last: null, end: null, ...targets
    },
    directions: { forward: 'yes', backward: 'yes' }
  };
}

// The members of TestControllerService the guards use
interface TestControllerServiceFake {
  testId: string;
  booklet: { config: { browserBehaviour: string } } | null;
  currentUnit: Unit | null;
  state$: BehaviorSubject<TestControllerState>;
  getUnit: jasmine.Spy<TestControllerService['getUnit']>;
  shouldShowConfirmationUI: jasmine.Spy<TestControllerService['shouldShowConfirmationUI']>;
  closeAllBuffers: jasmine.Spy<TestControllerService['closeAllBuffers']>;
  getNavigationState: jasmine.Spy<TestControllerService['getNavigationState']>;
  getUnitDeactivationCheck: jasmine.Spy<TestControllerService['getUnitDeactivationCheck']>;
  confirmEndTestIfNeeded: jasmine.Spy<TestControllerService['confirmEndTestIfNeeded']>;
}

// Set up for a running test whose units may be left.
function createTestControllerServiceFake(): TestControllerServiceFake {
  const fake: TestControllerServiceFake = {
    testId: '5',
    booklet: { config: { browserBehaviour: '' } },
    currentUnit: null,
    state$: new BehaviorSubject<TestControllerState>('RUNNING'),
    getUnit: jasmine.createSpy<TestControllerService['getUnit']>('getUnit'),
    shouldShowConfirmationUI: jasmine.createSpy<TestControllerService['shouldShowConfirmationUI']>(),
    closeAllBuffers: jasmine.createSpy<TestControllerService['closeAllBuffers']>('closeAllBuffers'),
    getNavigationState: jasmine.createSpy<TestControllerService['getNavigationState']>('getNavigationState'),
    getUnitDeactivationCheck: jasmine.createSpy<TestControllerService['getUnitDeactivationCheck']>(),
    confirmEndTestIfNeeded: jasmine.createSpy<TestControllerService['confirmEndTestIfNeeded']>()
  };
  fake.getUnit.and.callFake(sequenceId => {
    const unit = unitsBySequenceId[sequenceId];
    if (!unit) throw new Error(`no unit ${sequenceId}`);
    return unit;
  });
  fake.shouldShowConfirmationUI.and.returnValue(true);
  fake.closeAllBuffers.and.resolveTo(createNavigationState({}));
  fake.getNavigationState.and.returnValue(createNavigationState({}));
  fake.getUnitDeactivationCheck.and.returnValue(of(true));
  fake.confirmEndTestIfNeeded.and.resolveTo(true);
  return fake;
}

describe('Test controller route guards', () => {
  let tcs: TestControllerServiceFake;
  let messageService: jasmine.SpyObj<MessageService>;
  let location: SpyLocation;
  let router: Router;

  async function navigate(url: string): Promise<string> {
    await router.navigateByUrl(url);
    return router.url;
  }

  // Lets the browser go to url (back/forward button) and returns where the navigation ended up.
  async function navigateByBrowser(url: string): Promise<string> {
    const navigationEnded = firstValueFrom(router.events.pipe(
      filter(event => event instanceof NavigationEnd || event instanceof NavigationCancel ||
        event instanceof NavigationError)
    ));
    location.simulateUrlPop(url);
    await navigationEnded;
    return router.url;
  }

  beforeEach(() => {
    tcs = createTestControllerServiceFake();
    messageService = jasmine.createSpyObj<MessageService>('MessageService', ['showSnackbar']);

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideLocationMocks(),
        SpyLocation,
        { provide: Location, useExisting: SpyLocation },
        { provide: TestControllerService, useValue: tcs },
        { provide: MessageService, useValue: messageService }
      ]
    });
    location = TestBed.inject(SpyLocation);
    router = TestBed.inject(Router);
    // makes the router follow the location's popstate events
    router.initialNavigation();
  });

  describe('entering a unit', () => {
    it('enters an accessible unit', async () => {
      expect(await navigate('/t/5/u/1')).toBe('/t/5/u/1');
    });

    it('sends to the test before the booklet is loaded, e.g. after a reload', async () => {
      tcs.booklet = null;

      expect(await navigate('/t/5/u/3')).toBe('/t/5');
    });

    it('sends to the start page before the booklet is loaded if the test id is invalid', async () => {
      tcs.booklet = null;

      expect(await navigate('/t/abc/u/3')).toBe('/');
    });

    const blockingStates: TestControllerState[] = ['ERROR', 'TERMINATED', 'PAUSED'];
    blockingStates.forEach(state => {
      it(`does not enter a unit in state ${state}`, async () => {
        await navigate('/t/5/status');
        tcs.state$.next(state);

        expect(await navigate('/t/5/u/1')).toBe('/t/5/status');
      });
    });

    describe('that does not exist', () => {
      it('stays on the current unit if it is accessible', async () => {
        await navigate('/t/5/u/1');
        tcs.currentUnit = accessibleUnit;

        expect(await navigate('/t/5/u/99')).toBe('/t/5/u/1');
        expect(messageService.showSnackbar).toHaveBeenCalledWith('Navigation zu Aufgabe 99 nicht möglich');
      });

      it('goes to the previous accessible unit if the current one is not accessible', async () => {
        tcs.currentUnit = lockedUnit;
        tcs.closeAllBuffers.and.resolveTo(createNavigationState({ previous: 3 }));

        expect(await navigate('/t/5/u/99')).toBe('/t/5/u/3');
      });

      it('stays where it is without an accessible alternative', async () => {
        await navigate('/t/5/status');

        expect(await navigate('/t/5/u/99')).toBe('/t/5/status');
      });

      it('shows no message without confirmation UI', async () => {
        tcs.shouldShowConfirmationUI.and.returnValue(false);

        await navigate('/t/5/u/99');

        expect(messageService.showSnackbar).not.toHaveBeenCalled();
      });
    });

    describe('that is locked', () => {
      it('goes to the next accessible unit', async () => {
        tcs.getNavigationState.and.callFake(sequenceId => createNavigationState(sequenceId === 2 ? { next: 4 } : {}));

        expect(await navigate('/t/5/u/2')).toBe('/t/5/u/4');
      });

      it('enters it anyway without a next accessible unit', async () => {
        expect(await navigate('/t/5/u/2')).toBe('/t/5/u/2');
      });
    });
  });

  describe('leaving a unit within the test', () => {
    beforeEach(async () => {
      await navigate('/t/5/u/1');
    });

    it('leaves if the unit check allows it', async () => {
      expect(await navigate('/t/5/status')).toBe('/t/5/status');
      expect(tcs.getUnitDeactivationCheck).toHaveBeenCalledWith('/t/5/status');
    });

    it('stays if the unit check forbids it', async () => {
      tcs.getUnitDeactivationCheck.and.returnValue(of(false));

      expect(await navigate('/t/5/status')).toBe('/t/5/u/1');
    });

    it('blocks the browser\'s back and forward buttons if the booklet prevents it', async () => {
      tcs.booklet = { config: { browserBehaviour: 'preventNav' } };

      expect(await navigateByBrowser('/t/5/status')).toBe('/t/5/u/1');
      expect(tcs.getUnitDeactivationCheck).not.toHaveBeenCalled();
    });

    it('leaves the browser\'s back and forward buttons to the unit check otherwise', async () => {
      expect(await navigateByBrowser('/t/5/status')).toBe('/t/5/status');
      expect(tcs.getUnitDeactivationCheck).toHaveBeenCalledWith('/t/5/status');
    });
  });

  describe('leaving the test', () => {
    it('leaves from a unit if the unit check allows it and the end of the test is confirmed', async () => {
      await navigate('/t/5/u/1');

      expect(await navigate('/elsewhere')).toBe('/elsewhere');
      expect(tcs.getUnitDeactivationCheck).toHaveBeenCalledWith('/elsewhere');
      expect(tcs.confirmEndTestIfNeeded).toHaveBeenCalled();
    });

    it('stays on the unit if the unit check forbids it, without asking to end the test', async () => {
      await navigate('/t/5/u/1');
      tcs.getUnitDeactivationCheck.and.returnValue(of(false));

      expect(await navigate('/elsewhere')).toBe('/t/5/u/1');
      expect(tcs.confirmEndTestIfNeeded).not.toHaveBeenCalled();
    });

    it('stays if the end of the test is not confirmed', async () => {
      await navigate('/t/5/u/1');
      tcs.confirmEndTestIfNeeded.and.resolveTo(false);

      expect(await navigate('/elsewhere')).toBe('/t/5/u/1');
    });

    it('only asks to end the test when leaving from the status page', async () => {
      await navigate('/t/5/status');

      expect(await navigate('/elsewhere')).toBe('/elsewhere');
      expect(tcs.getUnitDeactivationCheck).not.toHaveBeenCalled();
      expect(tcs.confirmEndTestIfNeeded).toHaveBeenCalled();
    });
  });
});
