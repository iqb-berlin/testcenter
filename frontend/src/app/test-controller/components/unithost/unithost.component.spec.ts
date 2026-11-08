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
import { WidgetDeliveryService } from '../../services/widget-delivery.service';
import { WidgetRequest, WidgetRuntimeService } from '../../services/widget-runtime.service';

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
  let widgetDelivery: { findWidget: jasmine.Spy };
  let widgetRuntime: { open: jasmine.Spy; showUnavailable: jasmine.Spy };

  beforeEach(fakeAsync(() => {
    widgetDelivery = {
      findWidget: jasmine.createSpy('findWidget').and.callFake((model: string) => (model === 'PERIODIC_TABLE' ?
        { title: 'IQB Widget Periodensystem Auswahl', html: of('<html></html>') } :
        undefined))
    };
    widgetRuntime = {
      open: jasmine.createSpy('open').and.returnValue(true),
      showUnavailable: jasmine.createSpy('showUnavailable')
    };
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
        { provide: 'FILE_SERVER_URL', useValue: '/files/' },
        { provide: WidgetDeliveryService, useValue: widgetDelivery },
        { provide: WidgetRuntimeService, useValue: widgetRuntime }
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

  describe('widget calls', () => {
    const call = {
      type: 'vopWidgetCall',
      sessionId: 'u1',
      callId: 'periodic-1',
      widgetType: 'PERIODIC_TABLE',
      parameters: [{ key: 'MAX_NUMBER_OF_SELECTIONS', value: '1' }],
      state: 'H'
    };

    function openedRequest(): WidgetRequest {
      return widgetRuntime.open.calls.mostRecent().args[0] as WidgetRequest;
    }

    it('opens the widget the player calls, titled for test takers', () => {
      receive(currentPlayer(), call);

      expect(widgetDelivery.findWidget).toHaveBeenCalledOnceWith('PERIODIC_TABLE');
      expect(openedRequest()).toEqual(jasmine.objectContaining({
        title: 'Periodensystem',
        parameters: [{ key: 'MAX_NUMBER_OF_SELECTIONS', value: '1' }],
        state: 'H',
        losesWorkOnClose: true
      }));
    });

    it('sends the result back to the player', () => {
      const player = currentPlayer();
      receive(player, call);
      const send = spyOn(player, 'postMessage');
      openedRequest().onReturn?.('He', true);

      expect(send).toHaveBeenCalledOnceWith({
        type: 'vopWidgetReturn', sessionId: 'u1', callId: 'periodic-1', state: 'He'
      }, '*');
    });

    it('sends nothing back when the widget returns without saving', () => {
      const player = currentPlayer();
      receive(player, call);
      const send = spyOn(player, 'postMessage');
      openedRequest().onReturn?.('He', false);

      expect(send).not.toHaveBeenCalled();
    });

    it('shows that a widget the workspace lacks is unavailable', () => {
      receive(currentPlayer(), { ...call, widgetType: 'MOLECULE_EDITOR' });

      expect(widgetRuntime.showUnavailable).toHaveBeenCalledOnceWith('Molekül-Editor');
      expect(widgetRuntime.open).not.toHaveBeenCalled();
    });

    it('ignores calls from anything but the current player', () => {
      const previousPlayer = currentPlayer();
      MockActivatedRoute.params.next({ u: 1 });
      receive(previousPlayer, call);
      receive(window, call);

      expect(widgetRuntime.open).not.toHaveBeenCalled();
    });

    it('ignores an invalid call', () => {
      spyOn(console, 'error');
      receive(currentPlayer(), { ...call, parameters: 'MAX_NUMBER_OF_SELECTIONS=1' });

      expect(widgetRuntime.open).not.toHaveBeenCalled();
      expect(widgetRuntime.showUnavailable).not.toHaveBeenCalled();
    });
  });
});
