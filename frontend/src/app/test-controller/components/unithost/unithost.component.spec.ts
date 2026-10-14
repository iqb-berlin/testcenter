import {
  ComponentFixture, fakeAsync, TestBed, tick, waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { of, Subject } from 'rxjs';
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
  currentUnit: getTestData().Units.u1,
  unitAliasMap: { u1: 1 },
  unitContentReady$: of(false),
  navigationDenial$: new Subject<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }>(),
  navigation$: new Subject<NavigationState>(),
  configChanged$: new Subject<void>(),
  getWidgetResourcePath: jasmine.createSpy('getWidgetResourcePath')
};
const MockBackendService = { };
const MockMainDataService = {
  postMessage$: new Subject(),
  authData$: new Subject(),
  getAuthData: () => null
};
const MockActivatedRoute = {
  params: new Subject<Params>(),
  queryParamMap: new Subject()
};
const MockAssetService = {
  getAssetSrc: () => ''
};

describe('UnithostComponent', () => {
  let component: UnithostComponent;
  let fixture: ComponentFixture<UnithostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        UnithostComponent,
        CommonModule,
        MatSnackBarModule,
        MatDividerModule
      ],
      providers: [
        { provide: TestControllerService, useValue: MockTestControllerService },
        { provide: BackendService, useValue: MockBackendService },
        { provide: AssetService, useValue: MockAssetService },
        { provide: MainDataService, useValue: MockMainDataService },
        { provide: ActivatedRoute, useValue: MockActivatedRoute },
        { provide: 'FILE_SERVER_URL', useValue: '' },
        { provide: MessageService, useValue: {} }
      ]
    })
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    MockTestControllerService.getWidgetResourcePath.calls.reset();
    MockTestControllerService.getWidgetResourcePath.and.returnValue(undefined);
    fixture = TestBed.createComponent(UnithostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should log the resolved widget file and original call', () => {
    const log = spyOn(console, 'log');
    const warn = spyOn(console, 'warn');
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    const call = { type: 'vopWidgetCall', sessionId: 'u1', callId: 'button-1', widgetType: 'PERIODIC_TABLE' };

    MockMainDataService.postMessage$.next(new MessageEvent('message', { data: call, source: window }));

    expect(MockTestControllerService.getWidgetResourcePath).toHaveBeenCalledOnceWith('PERIODIC_TABLE');
    expect(log).toHaveBeenCalledOnceWith('vopWidgetCall resolved:', 'Resource/periodic.html', call);
    expect(warn).not.toHaveBeenCalled();
  });

  it('should warn when no uploaded widget matches the call', () => {
    const log = spyOn(console, 'log');
    const warn = spyOn(console, 'warn');
    const call = { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'UNKNOWN' };

    MockMainDataService.postMessage$.next(new MessageEvent('message', { data: call, source: window }));

    expect(warn).toHaveBeenCalledOnceWith('No uploaded widget found for vopWidgetCall:', call);
    expect(log).not.toHaveBeenCalled();
  });
});
