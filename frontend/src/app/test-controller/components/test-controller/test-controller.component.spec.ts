import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';
import { CustomtextService, ConnectionStatus, MainDataService } from '../../../shared/shared.module';
import { BackendService } from '../../services/backend.service';
import { CommandService } from '../../services/command.service';
import { TestControllerComponent } from './test-controller.component';
import {
  Command, TestControllerState, TestData, WindowFocusState
} from '../../interfaces/test-controller.interfaces';
import { TestControllerService } from '../../services/test-controller.service';
import { AppError } from '../../../app.interfaces';
import { TestMode } from '../../../config/test-mode';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../../../config/booklet-config';
import { MaxTimerData } from '../../classes/test-controller.classes';
// import { UnitMenuComponent } from './unit-menu/unit-menu.component';

const testData$ = new Subject<boolean | TestData>();
const command$ = new Subject<Command>();
const connectionStatus$ = new Subject<ConnectionStatus>();
const appWindowHasFocus$ = new Subject<WindowFocusState>();
const appError$ = new Subject<AppError>();
const testStatus$ = new BehaviorSubject<TestControllerState>(TestControllerState.ERROR);
const maxTimeTimer$ = new Subject<MaxTimerData>();
const routeParams$ = new Subject<Params>();
const currentUnitSequenceId$ = new Subject<number>();

@Component({
  template: '',
  selector: 'unit-menu'
})
class MockUnitMenuComponent {}

const MockBackendService = {
  getTestData: () => testData$
};

const MockCommandService = {
  command$,
  connectionStatus$
};

const MockMainDataService = {
  progressVisualEnabled: false,
  appWindowHasFocus$,
  appError$
};

const MockTestControllerService = {
  testStatus$,
  maxTimeTimer$,
  currentUnitSequenceId$,
  testMode: new TestMode(),
  bookletConfig: new BookletConfig(),
  testStatusEnum: TestControllerState,
  setUnitNavigationRequest: () => {},
  resetDataStore: () => {}
};

const MockActivatedRoute = {
  params: routeParams$
};

// eslint-disable-next-line @typescript-eslint/dot-notation
window['UAParser'] = () => ({
  browser: {
    version: 0,
    name: 'unit-tests'
  },
  os: {
    version: 0,
    name: 'unit-tests'
  },
  device: ['karma']
});

describe('TestControllerComponent', () => {
  let component: TestControllerComponent;
  let fixture: ComponentFixture<TestControllerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestControllerComponent,
        MockUnitMenuComponent
      ],
      imports: [
        CommonModule,
        MatIconModule,
        MatDialogModule,
        MatSidenavModule,
        RouterTestingModule.withRoutes([{ path: 'yourpath', redirectTo: '' }]),
        HttpClientModule,
        NoopAnimationsModule
      ],
      providers: [
        CustomtextService,
        MatSnackBar,
        { provide: TestControllerService, useValue: MockTestControllerService },
        { provide: BackendService, useValue: MockBackendService },
        { provide: CommandService, useValue: MockCommandService },
        { provide: MainDataService, useValue: MockMainDataService },
        { provide: ActivatedRoute, useValue: MockActivatedRoute },
        { provide: 'APP_VERSION', useValue: '0000' },
        { provide: 'IS_PRODUCTION_MODE', useValue: false }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestControllerComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
