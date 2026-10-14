import {
  ComponentFixture, fakeAsync, TestBed, tick, waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { of, Subject } from 'rxjs';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
  workspaceId: 1,
  currentUnit: getTestData().Units.u1,
  unitAliasMap: { u1: 1 },
  unitContentReady$: of(false),
  navigationDenial$: new Subject<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }>(),
  navigation$: new Subject<NavigationState>(),
  configChanged$: new Subject<void>(),
  getWidgetResourcePath: jasmine.createSpy('getWidgetResourcePath')
};
const MockMainDataService = {
  postMessage$: new Subject(),
  authData$: new Subject(),
  appConfig: { fileServiceUri: '' },
  getAuthData: () => ({ groupToken: 'test-group', viewSettings: {} })
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
  let http: HttpTestingController;

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
        BackendService,
        provideHttpClient(),
        provideHttpClientTesting(),
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
    MockTestControllerService.getWidgetResourcePath.calls.reset();
    MockTestControllerService.getWidgetResourcePath.and.returnValue(undefined);
    MockMainDataService.appConfig.fileServiceUri = '';
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UnithostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
  }));

  afterEach(() => {
    fixture.destroy();
    http.verify();
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

    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');
    expect(request.request.responseType).toBe('text');
    request.event({ type: HttpEventType.DownloadProgress, loaded: 5, total: 20 });
    expect(log).toHaveBeenCalledTimes(1);
    const html = '<html>widget</html>';
    request.flush(html);
    expect(log).toHaveBeenCalledWith('Widget HTML downloaded:', {
      resourcePath: 'Resource/periodic.html', htmlLength: html.length
    });
  });

  it('should log a missing widget without starting a download', () => {
    const log = spyOn(console, 'log');
    const warn = spyOn(console, 'warn');
    const call = { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'UNKNOWN' };

    MockMainDataService.postMessage$.next(new MessageEvent('message', { data: call, source: window }));

    expect(log).toHaveBeenCalledOnceWith('No uploaded widget found for vopWidgetCall:', call);
    expect(warn).not.toHaveBeenCalled();
  });

  it('should report a widget download failure without logging success', () => {
    const log = spyOn(console, 'log');
    const error = spyOn(console, 'error');
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/missing.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: window
    }));

    http.expectOne('/api/file/test-group/ws_1/Resource/missing.html').flush('Not found', {
      status: 404, statusText: 'Not Found'
    });
    expect(error).toHaveBeenCalledOnceWith('Widget HTML download failed:', 'Resource/missing.html', jasmine.anything());
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('should download through the file server when configured', () => {
    const log = spyOn(console, 'log');
    MockMainDataService.appConfig.fileServiceUri = 'configured';
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: window
    }));

    http.expectOne('/files/file/test-group/ws_1/Resource/periodic.html').flush('<html>widget</html>');
    expect(log).toHaveBeenCalledWith('Widget HTML downloaded:', {
      resourcePath: 'Resource/periodic.html', htmlLength: '<html>widget</html>'.length
    });
  });

  it('should report an empty HTML response as a download failure', () => {
    const log = spyOn(console, 'log');
    const error = spyOn(console, 'error');
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/empty.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: window
    }));

    http.expectOne('/api/file/test-group/ws_1/Resource/empty.html').flush('');
    expect(error).toHaveBeenCalledOnceWith('Widget HTML download failed:', 'Resource/empty.html', jasmine.any(Error));
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending downloads when the unit host is destroyed', () => {
    const log = spyOn(console, 'log');
    MockTestControllerService.getWidgetResourcePath.and.returnValue('Resource/periodic.html');
    MockMainDataService.postMessage$.next(new MessageEvent('message', {
      data: { type: 'vopWidgetCall', sessionId: 'u1', widgetType: 'PERIODIC_TABLE' }, source: window
    }));
    const request = http.expectOne('/api/file/test-group/ws_1/Resource/periodic.html');

    fixture.destroy();
    expect(request.cancelled).toBeTrue();
    expect(log).toHaveBeenCalledTimes(1);
  });
});
