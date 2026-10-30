import {
  ComponentFixture, fakeAsync, TestBed, tick, waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AssetService } from '@shared/services/asset.service';
import { WidgetRuntimeService } from '../../services/widget-runtime.service';
import { UnithostComponent } from './unithost.component';
import { TestControllerService } from '../../services/test-controller.service';
import { BackendService } from '../../services/backend.service';
import { MainDataService, BookletConfig } from '../../../shared/shared.module';
import { VeronaNavigationDeniedReason } from '../../interfaces/verona.interfaces';
import { NavigationState } from '../../interfaces/test-controller.interfaces';
import { getTestData } from '../../test/test-data';
import { MessageService } from '../../../shared/services/message.service';

const bookletConfig = new BookletConfig();
bookletConfig.setFromKeyValuePairs({
  loading_mode: 'LAZY',
  logPolicy: 'rich',
  pagingMode: 'separate',
  page_navibuttons: 'FULL',
  unit_navibuttons: 'LABEL',
  unit_menu: 'OFF',
  force_presentation_complete: 'OFF',
  force_responses_complete: 'OFF',
  unit_screenheader: 'EMPTY',
  unit_title: 'ON',
  unit_show_time_left: 'OFF'
});

const MockTestControllerService = {
  bookletConfig,
  workspaceId: 1,
  testMode: { saveResponses: true },
  testId: 'routing-regression',
  currentUnitSequenceId: 1,
  currentTimerId: '[0]',
  currentUnitSequenceId$: new BehaviorSubject(1),
  state$: new BehaviorSubject('RUNNING'),
  runReset$: new Subject<void>(),
  sharedParameters: [{ key: 'shared', value: '' }],
  addSharedParameters: jasmine.createSpy('addSharedParameters'),
  currentUnit: getTestData().Units.u1,
  closeAllBuffers: jasmine.createSpy('closeAllBuffers'),
  getUnit: () => getTestData().Units.u1,
  AddToUnitStateBuffer: jasmine.createSpy('AddToUnitStateBuffer'),
  AddToUnitStateDataPartsBuffer: jasmine.createSpy('AddToUnitStateDataPartsBuffer'),
  unitAliasMap: { u1: 1 },
  unitContentReady$: new BehaviorSubject(false),
  unitBlockResourcesLoaded$: () => of(undefined),
  addToTestStateBuffer: () => {},
  updateNavigationState: () => {},
  getPlayer: () => '<html></html>',
  navigationDenial$: new Subject<{ sourceUnitSequenceId: number; reason: VeronaNavigationDeniedReason[] }>(),
  navigation$: new Subject<NavigationState>(),
  configChanged$: new Subject<void>()
};
const MockMainDataService = {
  postMessage$: new Subject(),
  authData$: new Subject(),
  appConfig: { fileServiceUri: '' },
  appSubTitle$: new Subject<string>(),
  getAuthData: () => ({ groupToken: 'test-group', viewSettings: {} })
};
const MockActivatedRoute = {
  params: new Subject<Params>(),
  queryParamMap: new Subject()
};
const MockAssetService = {
  getAssetSrc: () => ''
};

describe('UnithostComponent player sessions', () => {
  let component: UnithostComponent;
  let fixture: ComponentFixture<UnithostComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [
        UnithostComponent,
        CommonModule,
        MatSnackBarModule,
        MatDividerModule,
        MatDialogModule,
        MatIconTestingModule
      ],
      providers: [
        provideNoopAnimations(),
        { provide: TestControllerService, useValue: MockTestControllerService },
        BackendService,
        { provide: WidgetRuntimeService, useValue: { close: () => {} } },
        provideHttpClient(),
        { provide: AssetService, useValue: MockAssetService },
        { provide: MainDataService, useValue: MockMainDataService },
        { provide: ActivatedRoute, useValue: MockActivatedRoute },
        { provide: 'FILE_SERVER_URL', useValue: '/files/' },
        { provide: 'BACKEND_URL', useValue: '/api/' },
        { provide: MessageService, useValue: {} }
      ]
    })
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    MockTestControllerService.currentUnitSequenceId$.next(1);
    MockTestControllerService.state$.next('RUNNING');
    MockTestControllerService.sharedParameters = [{ key: 'shared', value: '' }];
    MockTestControllerService.addSharedParameters.calls.reset();
    MockTestControllerService.AddToUnitStateBuffer.calls.reset();
    MockTestControllerService.AddToUnitStateDataPartsBuffer.calls.reset();
    MockMainDataService.appConfig.fileServiceUri = '';
    MockTestControllerService.currentUnit = getTestData().Units.u1;
    fixture = TestBed.createComponent(UnithostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    MockActivatedRoute.params.next({ u: 1 });
    tick();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  function playerIframe(): HTMLIFrameElement {
    const player = (fixture.nativeElement as HTMLElement).querySelector<HTMLIFrameElement>('iframe.unitHost');
    if (!player) throw new Error('Missing player iframe');
    return player;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('accepts late state only from the player that owned the session', fakeAsync(() => {
    const source = playerIframe().contentWindow;
    MockActivatedRoute.params.next({ u: 1 });
    tick();
    MockTestControllerService.AddToUnitStateDataPartsBuffer.calls.reset();
    const data = {
      type: 'vopStateChangedNotification', sessionId: 'u1',
      unitState: { dataParts: { answer: 'late response' } }
    };
    MockMainDataService.postMessage$.next(new MessageEvent('message', { source: window, data }));
    expect(MockTestControllerService.AddToUnitStateDataPartsBuffer).not.toHaveBeenCalled();
    MockMainDataService.postMessage$.next(new MessageEvent('message', { source, data }));
    expect(MockTestControllerService.AddToUnitStateDataPartsBuffer)
      .toHaveBeenCalledOnceWith(1, { answer: 'late response' }, '');
  }));

  it('does not start a replacement player after waiting for buffers', fakeAsync(() => {
    let finish!: (navigation: NavigationState) => void;
    MockTestControllerService.closeAllBuffers.and.returnValue(new Promise<NavigationState>((resolve) => {
      finish = resolve;
    }));
    const source = playerIframe().contentWindow;
    if (!source) throw new Error('Missing player');
    const send = spyOn(source, 'postMessage');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      source, data: { type: 'vopReadyNotification', apiVersion: '6.0' }
    }));
    MockActivatedRoute.params.next({ u: 1 });
    tick();
    const replacement = playerIframe().contentWindow;
    if (!replacement) throw new Error('Missing replacement player');
    const replacementSend = spyOn(replacement, 'postMessage');
    finish({} as NavigationState);
    tick();
    expect(send).not.toHaveBeenCalled();
    expect(replacementSend).not.toHaveBeenCalled();
  }));
});
