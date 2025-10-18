import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';
import {
  CustomtextService, ConnectionStatus, MainDataService, BookletConfig, TestMode, BackendService as SharedBackendService
} from '../../../shared/shared.module';
import { BackendService } from '../../services/backend.service';
import { CommandService } from '../../services/command.service';
import { TestControllerComponent } from './test-controller.component';
import {
  Command, TestControllerState, TestData, WindowFocusState
} from '../../interfaces/test-controller.interfaces';
import { TestControllerService } from '../../services/test-controller.service';
import { AppError } from '../../../app.interfaces';
import { TimerData } from '../../classes/test-controller.classes';

const testData$ = new Subject<boolean | TestData>();
const command$ = new Subject<Command>();
const connectionStatus$ = new Subject<ConnectionStatus>();
const appWindowHasFocus$ = new Subject<WindowFocusState>();
const appError$ = new Subject<AppError>();
const testStatus$ = new BehaviorSubject<TestControllerState>('ERROR');
const maxTimeTimer$ = new Subject<TimerData>();
const routeParams$ = new Subject<Params>();
const currentUnitSequenceId$ = new Subject<number>();

@Component({
  template: '',
  selector: 'tc-unit-menu'
})
class MockUnitMenuComponent {
  // @Input() menu: Array<UnitNaviButtonData | string> = [];
}

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
  setUnitNavigationRequest: () => {},
  resetDataStore: () => {}
};

const MockSharedBackendService = {};

const MockActivatedRoute = {
  params: routeParams$
};

describe('TestControllerComponent', () => {
  let component: TestControllerComponent;
  let fixture: ComponentFixture<TestControllerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    declarations: [
        TestControllerComponent,
        MockUnitMenuComponent
    ],
    imports: [CommonModule,
        MatIconModule,
        MatDialogModule,
        MatSidenavModule,
        RouterTestingModule.withRoutes([{ path: 'yourpath', redirectTo: '' }]),
        NoopAnimationsModule],
    providers: [
        CustomtextService,
        MatSnackBar,
        { provide: TestControllerService, useValue: MockTestControllerService },
        { provide: BackendService, useValue: MockBackendService },
        { provide: CommandService, useValue: MockCommandService },
        { provide: MainDataService, useValue: MockMainDataService },
        { provide: ActivatedRoute, useValue: MockActivatedRoute },
        { provide: SharedBackendService, useValue: MockSharedBackendService },
        { provide: 'IS_PRODUCTION_MODE', useValue: false },
        provideHttpClient(withInterceptorsFromDi())
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
