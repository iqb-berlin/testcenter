import {
  ComponentFixture, fakeAsync, TestBed, tick
} from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AssetService } from '@shared/services/asset.service';
import { UnithostComponent } from './unithost.component';
import { TestControllerService } from '../../services/test-controller.service';
import { BackendService } from '../../services/backend.service';
import { MainDataService, BookletConfig } from '../../../shared/shared.module';
import { VeronaNavigationDeniedReason } from '../../interfaces/verona.interfaces';
import { NavigationState } from '../../interfaces/test-controller.interfaces';
import { MessageService } from '../../../shared/services/message.service';
import { getTestData } from '../../test/test-data';

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
  booklet: { config: bookletConfig },
  workspaceId: 1,
  testMode: {},
  currentUnitSequenceId: 1,
  currentUnit: getTestData().Units.u1,
  currentTimerId: getTestData().Units.u1.parent.timerId, // timer is already running
  sharedParameters: [],
  unitAliasMap: { u1: 1 },
  closeAllBuffers: jasmine.createSpy('closeAllBuffers'),
  unitBlockResourcesLoaded$: () => of(undefined),
  unitContentReady$: new BehaviorSubject(false),
  windowFocusState$: new Subject<string>(),
  navigationDenial$: new Subject<{ sourceUnitSequenceId: number; reason: VeronaNavigationDeniedReason[] }>(),
  navigation$: new Subject<NavigationState>(),
  configChanged$: new Subject<void>(),
  addToTestStateBuffer: () => {},
  AddToUnitStateBuffer: () => {},
  updateNavigationState: () => {},
  getPlayer: () => '<html></html>'
};
const MockMainDataService = {
  postMessage$: new Subject<MessageEvent>(),
  appSubTitle$: new Subject<string>(),
  appConfig: { fileServiceUri: '', veronaPlayerApiVersionMin: 1, veronaPlayerApiVersionMax: 6 },
  getAuthData: () => null
};
const MockActivatedRoute = {
  params: new Subject<Params>(),
  queryParamMap: new Subject<Params>()
};
const MockAssetService = {
  getAssetSrc: () => ''
};

describe('UnithostComponent', () => {
  let component: UnithostComponent;
  let fixture: ComponentFixture<UnithostComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        UnithostComponent,
        CommonModule,
        MatSnackBarModule,
        MatDividerModule
      ],
      providers: [
        { provide: TestControllerService, useValue: MockTestControllerService },
        { provide: BackendService, useValue: { backendUrl: '/api/' } },
        { provide: AssetService, useValue: MockAssetService },
        { provide: MainDataService, useValue: MockMainDataService },
        { provide: ActivatedRoute, useValue: MockActivatedRoute },
        { provide: MessageService, useValue: {} },
        { provide: 'FILE_SERVER_URL', useValue: '/files/' }
      ]
    });
    fixture = TestBed.createComponent(UnithostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick(); // ngOnInit subscribes in a timeout
    MockActivatedRoute.params.next({ u: 1 });
  }));

  afterEach(() => {
    fixture.destroy();
  });

  function currentPlayer(): Window {
    const player = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLIFrameElement>('iframe.unitHost')?.contentWindow;
    if (!player) throw new Error('Missing player iframe');
    return player;
  }

  function receive(source: Window, data: object): void {
    MockMainDataService.postMessage$.next(new MessageEvent('message', { source, data }));
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ignores messages that are not from a player', () => {
    const warn = spyOn(console, 'warn');
    const log = spyOn(console, 'log');

    receive(currentPlayer(), { type: 'vowStateChangedNotification', sessionId: '1' });

    expect(warn).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('keeps talking to the current player after a message from the previous one', () => {
    const previousPlayer = currentPlayer();
    MockActivatedRoute.params.next({ u: 1 });
    const send = spyOn(currentPlayer(), 'postMessage');

    receive(previousPlayer, { type: 'vopWindowFocusChangedNotification', hasFocus: false });
    MockTestControllerService.navigationDenial$.next({ sourceUnitSequenceId: 1, reason: ['responsesIncomplete'] });

    expect(send).toHaveBeenCalledOnceWith(jasmine.objectContaining({ type: 'vopNavigationDeniedNotification' }), '*');
  });

  it('does not start a player that was replaced while saving', fakeAsync(() => {
    let finishSaving!: (navigation: NavigationState) => void;
    MockTestControllerService.closeAllBuffers.and.returnValue(new Promise<NavigationState>((resolve) => {
      finishSaving = resolve;
    }));
    const previousPlayer = currentPlayer();
    const sendToPrevious = spyOn(previousPlayer, 'postMessage');

    receive(previousPlayer, { type: 'vopReadyNotification', apiVersion: '6.0' });
    MockActivatedRoute.params.next({ u: 1 });
    const sendToCurrent = spyOn(currentPlayer(), 'postMessage');
    finishSaving({ targets: {} } as NavigationState);
    tick();

    expect(sendToPrevious).not.toHaveBeenCalled();
    expect(sendToCurrent).not.toHaveBeenCalled();
  }));
});
