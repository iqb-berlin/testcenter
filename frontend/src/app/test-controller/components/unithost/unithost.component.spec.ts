import {
  ComponentFixture, fakeAsync, TestBed, tick
} from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { AssetService } from '@shared/services/asset.service';
import { WidgetRuntimeService } from '../../services/widget-runtime.service';
import { CalculatorService } from '../../services/calculator.service';
import { UnithostComponent } from './unithost.component';
import { TestControllerService } from '../../services/test-controller.service';
import { BackendService } from '../../services/backend.service';
import { MainDataService, BookletConfig } from '../../../shared/shared.module';
import { VeronaNavigationDeniedReason } from '../../interfaces/verona.interfaces';
import { NavigationState } from '../../interfaces/test-controller.interfaces';
import { getTestData } from '../../test/test-data';
import { MessageService } from '../../../shared/services/message.service';

function testUnit(alias: 'u1' | 'u2') {
  const unit = getTestData().Units[alias];
  return { ...unit, parent: { ...unit.parent, locked: null } };
}

const bookletConfig = new BookletConfig();

const MockTestControllerService = {
  bookletConfig,
  currentUnitSequenceId: 1,
  currentTimerId: '[0]',
  currentUnit: testUnit('u1'),
  closeAllBuffers: jasmine.createSpy('closeAllBuffers'),
  getUnit: (sequenceId: number) => testUnit(sequenceId === 2 ? 'u2' : 'u1'),
  AddToUnitStateBuffer: jasmine.createSpy('AddToUnitStateBuffer'),
  AddToUnitStateDataPartsBuffer: jasmine.createSpy('AddToUnitStateDataPartsBuffer'),
  unitAliasMap: { u1: 1, u2: 2 },
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

describe('UnithostComponent player messages', () => {
  let fixture: ComponentFixture<UnithostComponent>;

  const runtime = { open: jasmine.createSpy('open'), close: () => {} };
  const calculator = { supports: (model: string) => model === 'CALC', createBehavior: jasmine.createSpy('behavior') };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UnithostComponent, MatIconTestingModule
      ],
      providers: [
        provideNoopAnimations(),
        { provide: TestControllerService, useValue: MockTestControllerService },
        BackendService,
        { provide: WidgetRuntimeService, useValue: runtime },
        { provide: CalculatorService, useValue: calculator },
        provideHttpClient(),
        { provide: AssetService, useValue: MockAssetService },
        { provide: MainDataService, useValue: MockMainDataService },
        { provide: ActivatedRoute, useValue: MockActivatedRoute },
        { provide: 'FILE_SERVER_URL', useValue: '/files/' },
        { provide: 'BACKEND_URL', useValue: '/api/' },
        { provide: MessageService, useValue: {} }
      ]
    });
  });

  beforeEach(fakeAsync(() => {
    runtime.open.calls.reset();
    MockTestControllerService.AddToUnitStateBuffer.calls.reset();
    MockTestControllerService.AddToUnitStateDataPartsBuffer.calls.reset();
    MockTestControllerService.currentUnit = testUnit('u1');
    fixture = TestBed.createComponent(UnithostComponent);
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

  it('accepts late state only from the player that owned the session', fakeAsync(() => {
    const source = playerIframe().contentWindow;
    MockTestControllerService.currentUnit = testUnit('u2');
    MockActivatedRoute.params.next({ u: 2 });
    tick();
    MockTestControllerService.AddToUnitStateDataPartsBuffer.calls.reset();
    const data = {
      type: 'vopStateChangedNotification', sessionId: 'u1',
      unitState: { dataParts: { answer: 'late response' } }
    };
    MockMainDataService.postMessage$.next(new MessageEvent('message', { source: window, data }));
    MockMainDataService.postMessage$.next(new MessageEvent('message', { source, data: { ...data, sessionId: 'u2' } }));
    expect(MockTestControllerService.AddToUnitStateDataPartsBuffer).not.toHaveBeenCalled();
    MockMainDataService.postMessage$.next(new MessageEvent('message', { source, data }));
    expect(MockTestControllerService.AddToUnitStateDataPartsBuffer)
      .toHaveBeenCalledOnceWith(1, { answer: 'late response' }, '');
  }));

  for (const changed of ['player frame', 'current unit']) {
    it(`does not start after the ${changed} changes while waiting for buffers`, fakeAsync(() => {
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
      if (changed === 'player frame') MockActivatedRoute.params.next({ u: 1 });
      else MockTestControllerService.currentUnit = testUnit('u2');
      tick();
      const replacement = playerIframe().contentWindow;
      if (!replacement) throw new Error('Missing replacement player');
      const replacementSend = replacement === source ? send : spyOn(replacement, 'postMessage');
      finish({} as NavigationState);
      tick();
      expect(send).not.toHaveBeenCalled();
      expect(replacementSend).not.toHaveBeenCalled();
    }));
  }

  it('routes calls from the current player and rejects other sources or sessions', () => {
    const call = { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' };
    const frame = playerIframe();
    for (const [source, data] of [[window, call], [frame.contentWindow, { ...call, sessionId: 'unknown' }]] as const) {
      MockMainDataService.postMessage$.next(new MessageEvent('message', { source, data }));
    }
    expect(runtime.open).not.toHaveBeenCalled();
    MockMainDataService.postMessage$.next(new MessageEvent('message', { source: frame.contentWindow, data: call }));
    expect(runtime.open).toHaveBeenCalledOnceWith({ call, source: frame.contentWindow, playerIframe: frame },
                                                  jasmine.any(Function));
    const behaviorFor = runtime.open.calls.mostRecent().args[1] as
      (request: { model: string; resourcePath: string }) => unknown;
    behaviorFor({ model: 'PERIODIC_TABLE', resourcePath: 'table.html' });
    expect(calculator.createBehavior).not.toHaveBeenCalled();
    behaviorFor({ model: 'CALC', resourcePath: 'calc.html' });
    expect(calculator.createBehavior).toHaveBeenCalledWith('calc.html');
  });
});
