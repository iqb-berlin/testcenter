import { TestControllerModule } from '../../test-controller.module';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  CustomtextService, ConnectionStatus, MainDataService, TestMode, BackendService as SharedBackendService
} from '../../../shared/shared.module';
import { AppError } from '../../../app.interfaces';
import { BackendService } from '../../services/backend.service';
import { CommandService } from '../../services/command.service';
import { TestControllerService } from '../../services/test-controller.service';
import { TestLoaderService } from '../../services/test-loader.service';
import { TestControllerComponent } from './test-controller.component';
import {
  Booklet, Command, TestControllerState, TestData, Unit, WindowFocusState
} from '../../interfaces/test-controller.interfaces';
import { TimerData } from '../../classes/test-controller.classes';

function createController() {
  const data: { booklet: Booklet | null; units: Record<number, Unit>; widgets: TestData['widgets'] } = {
    booklet: null, units: {}, widgets: { CALCULATOR: ['Resource/calculator.html'] }
  };
  return {
    ...data, workspaceId: 1, currentUnitSequenceId: 1, totalLoadingProgress: 0,
    get currentUnit(): Unit | null { return this.units[this.currentUnitSequenceId] || null; },
    currentUnitSequenceId$: new Subject<number>(), runReset$: new Subject<void>(),
    state$: new BehaviorSubject<TestControllerState>('RUNNING'), unitContentReady$: new BehaviorSubject(true),
    timers$: new Subject<TimerData>(), navigation$: new Subject(),
    windowFocusState$: new BehaviorSubject<WindowFocusState>('HOST'),
    testMode: new TestMode(), sharedParameters: [],
    addSharedParameters: jasmine.createSpy('addSharedParameters'),
    addToTestStateBuffer: jasmine.createSpy('addToTestStateBuffer'),
    setUnitNavigationRequest: jasmine.createSpy('setUnitNavigationRequest'),
    getWidgetResourcePath(model: string): string | undefined {
      return TestControllerService.prototype.getWidgetResourcePath.call(this, model);
    }
  };
}

describe('TestControllerComponent', () => {
  let fixture: ComponentFixture<TestControllerComponent>;
  let component: TestControllerComponent;
  let controller: ReturnType<typeof createController>;
  let messages: Subject<MessageEvent>;
  let http: HttpTestingController;
  let dialog: MatDialog;
  let authData: Subject<void>;

  beforeEach(fakeAsync(() => {
    controller = createController();
    messages = new Subject<MessageEvent>();
    authData = new Subject<void>();
    TestBed.configureTestingModule({
      imports: [TestControllerModule, MatIconTestingModule, NoopAnimationsModule, RouterTestingModule],
      providers: [
        CustomtextService, BackendService,
        { provide: TestControllerService, useValue: controller },
        { provide: CommandService, useValue: {
          command$: new Subject<Command>(), connectionStatus$: new Subject<ConnectionStatus>()
        } },
        { provide: MainDataService, useValue: {
          appError$: new Subject<AppError>(), appWindowHasFocus$: new Subject<boolean>(),
          authData$: authData, postMessage$: messages, appConfig: { fileServiceUri: '' },
          clearErrorBuffer: () => {},
          getAuthData: () => ({ displayName: 'testAccountName', groupToken: 'header-group' })
        } },
        { provide: ActivatedRoute, useValue: { params: new Subject<Params>() } },
        { provide: SharedBackendService, useValue: {} },
        { provide: 'IS_PRODUCTION_MODE', useValue: true },
        { provide: 'FILE_SERVER_URL', useValue: '/files/' },
        { provide: 'BACKEND_URL', useValue: '/api/' },
        provideHttpClient(), provideHttpClientTesting()
      ]
    });
    controller.booklet = TestBed.inject(TestLoaderService).parseBookletXml(`<Booklet>
      <Metadata><Id>widget-test</Id><Label>Widget test</Label></Metadata>
      <Units><Unit id="u1" label="Task"/></Units></Booklet>`);
    const unit = controller.booklet.units.children[0];
    if ('sequenceId' in unit) controller.units[unit.sequenceId] = unit;
    fixture = TestBed.createComponent(TestControllerComponent);
    component = fixture.componentInstance;
    // Supply the viewport height normally provided by the application's flex layout.
    fixture.nativeElement.style.height = 'calc(100vh - 16px)';
    fixture.detectChanges();
    tick();
    controller.currentUnitSequenceId$.next(1);
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);
  }));

  afterEach(() => {
    fixture.destroy();
    controller.currentUnitSequenceId$.complete();
    controller.navigation$.complete();
    dialog.closeAll();
    http.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
