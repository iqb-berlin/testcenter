/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import {
  BehaviorSubject, Observable, of, Subject
} from 'rxjs';
import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import { ActivatedRoute, Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Pipe } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AlertComponent, CustomtextPipe, MainDataService } from '../shared/shared.module';
import { GroupMonitorComponent } from './group-monitor.component';
import {
  CheckingOptions, CommandResponse, Profile,
  TestSession, TestSessionData, TestSessionSetStat
} from './group-monitor.interfaces';
import { BackendService } from './backend.service';
import { TestSessionComponent } from './test-session/test-session.component';
import { TestSessionManager } from './test-session-manager/test-session-manager.service';
import {
  unitTestSessionsStats,
  unitTestCheckedStats,
  unitTestExampleSessions,
  unitTestCommandResponse
} from './unit-test-example-data.spec';
import { TemplateContextDirective } from '../shared/directives/template-context.directive';
import { TimeLeftPipe } from './test-session/timeleft.pipe';
import { PositionPipe } from './test-session/position.pipe';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatIconTestingModule } from '@angular/material/icon/testing';

class MockMatDialog {
  open(): { afterClosed: () => Observable<{ action: boolean }> } {
    return {
      afterClosed: () => of({ action: true })
    };
  }
}

class MockBackendService {
  profile$ = new Subject<Profile>();

  observeSessionsMonitor(): Observable<TestSessionData[]> {
    return of([unitTestExampleSessions[0].data]);
  }

  getProfile(): Observable<Profile> {
    return this.profile$;
  }

  cutConnection(): void {}
}

class MockTestSessionManagerService {
  checkingOptions: CheckingOptions = {
    enableAutoCheckAll: false,
    autoCheckAll: true
  };

  sessionsStats$ = new BehaviorSubject<TestSessionSetStat>(unitTestSessionsStats);
  checkedStats$ = new BehaviorSubject<TestSessionSetStat>(unitTestCheckedStats);
  sessions$ = new BehaviorSubject<TestSession[]>(unitTestExampleSessions);
  commandResponses$ = new BehaviorSubject<CommandResponse>(unitTestCommandResponse);
  sessions = unitTestExampleSessions;
  filterOptions = {
    quick: { selected: false, source: 'quick', filter: { value: '' } }
  };

  refreshFilters = jasmine.createSpy('refreshFilters');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connect = (_: string) => {};
  disconnect = () => {};
  isChecked = () => false;
  resetFilters = () => null;
}

@Pipe({
  name: 'customtext',
  standalone: false
})
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MockCustomtextPipe {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(defaultValue: string, ..._: string[]): Observable<string> {
    return of<string>(defaultValue);
  }
}

class MockMainDataService {
  appTitle$ = new BehaviorSubject<string>('Testcenter');
  appSubTitle$ = new BehaviorSubject<string>('');
  getAuthData = () => ({
    displayName: 'testAccountName'
  });

  getAccessObject = () => ({ label: 'A group' });
}

describe('GroupMonitorComponent', () => {
  let component: GroupMonitorComponent;
  let fixture: ComponentFixture<GroupMonitorComponent>;
  let sessionManager: MockTestSessionManagerService;
  let backend: MockBackendService;
  let routeParams: BehaviorSubject<Params>;

  beforeEach(async () => {
    sessionManager = new MockTestSessionManagerService();
    backend = new MockBackendService();
    routeParams = new BehaviorSubject<Params>({ 'group-name': 'a_group' });
    await TestBed.configureTestingModule({
      declarations: [
        GroupMonitorComponent,
        TestSessionComponent,
        TimeLeftPipe,
        PositionPipe
      ],
      imports: [
        FormsModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
        RouterTestingModule,
        MatMenuModule,
        MatSidenavModule,
        NoopAnimationsModule,
        MatRadioModule,
        MatCheckboxModule,
        MatTableModule,
        MatSlideToggleModule,
        MatIconTestingModule,
        AlertComponent,
        TemplateContextDirective,
        CustomtextPipe
      ],
      providers: [
        { provide: TestSessionManager, useValue: sessionManager },
        { provide: MatDialog, useValue: new MockMatDialog() },
        { provide: BackendService, useValue: backend },
        { provide: ActivatedRoute, useValue: { params: routeParams } },
        { provide: MainDataService, useValue: new MockMainDataService() },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupMonitorComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should search as the input changes and keep the field visible when cleared', () => {
    const monitor = fixture.nativeElement as HTMLElement;
    const input = monitor.querySelector<HTMLInputElement>('input[role="searchbox"]')!;
    const quickFilter = sessionManager.filterOptions.quick;

    input.value = 'Teilnehmer 1';
    input.dispatchEvent(new Event('input'));
    expect(quickFilter.selected).toBeTrue();
    expect(quickFilter.filter.value).toBe('Teilnehmer 1');
    expect(sessionManager.refreshFilters).toHaveBeenCalledTimes(1);

    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('focusout'));
    fixture.detectChanges();
    expect(quickFilter.selected).toBeFalse();
    expect(sessionManager.refreshFilters).toHaveBeenCalledTimes(2);
    expect(monitor.querySelector('input[role="searchbox"]')).toBe(input);
  });

  describe('controls', () => {
    const controlButtons = {
      resume: 'GM_forward_button',
      pause: 'GM_pause_button',
      goto: 'GM_jump_button',
      unlock: 'GM_lock_button',
      finish: 'GM_end_button'
    };

    const visibleControls = (): string[] => {
      fixture.detectChanges();
      const monitor = fixture.nativeElement as HTMLElement;
      return Object.entries(controlButtons)
        .filter(([, dataCy]) => monitor.querySelector(`[data-cy="${dataCy}"]`))
        .map(([control]) => control);
    };

    const profile = (hiddenControls?: string): Profile => ({
      id: 'a_profile',
      label: 'A profile',
      settings: hiddenControls === undefined ? {} : { hiddenControls },
      filtersEnabled: {},
      filters: []
    });

    it('should show all controls without a profile', () => {
      expect(visibleControls()).toEqual(['resume', 'pause', 'goto', 'unlock', 'finish']);
    });

    it('should show no control until the profile is loaded', () => {
      routeParams.next({ 'group-name': 'a_group', 'profile-id': 'a_profile' });
      expect(visibleControls()).toEqual([]);
    });

    it('should hide the controls the profile lists', () => {
      routeParams.next({ 'group-name': 'a_group', 'profile-id': 'a_profile' });
      backend.profile$.next(profile('goto  unlock finish'));
      expect(visibleControls()).toEqual(['resume', 'pause']);
    });

    it('should show all controls if the profile lists none', () => {
      routeParams.next({ 'group-name': 'a_group', 'profile-id': 'a_profile' });
      backend.profile$.next(profile());
      expect(visibleControls()).toEqual(['resume', 'pause', 'goto', 'unlock', 'finish']);
    });

    it('should replace the hidden controls when another profile is opened', () => {
      routeParams.next({ 'group-name': 'a_group', 'profile-id': 'a_profile' });
      backend.profile$.next(profile('pause'));
      routeParams.next({ 'group-name': 'a_group', 'profile-id': 'another_profile' });
      expect(visibleControls()).toEqual([]);
      backend.profile$.next(profile('goto'));
      expect(visibleControls()).toEqual(['resume', 'pause', 'unlock', 'finish']);
    });
  });
});
