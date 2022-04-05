import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { KeyValuePairString, UnitStateData } from '../interfaces/test-controller.interfaces';
import { TestMode } from '../../config/test-mode';

const uploadedData: UnitStateData[] = [];

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  updateDataParts(
    testId: string, unitDbKey: string, dataParts: KeyValuePairString, unitStateDataType: string
  ): Observable<boolean> {
    uploadedData.push({ unitDbKey, dataParts, unitStateDataType });
    return of(true);
  }
}

let service: TestControllerService;

describe('TestControllerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestControllerService,
        {
          provide: BackendService,
          useValue: new MockBackendService()
        }
      ],
      imports: [
        RouterTestingModule,
        HttpClientModule
      ]
    })
      .compileComponents();
    service = TestBed.inject(TestControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should normaliseIds correctly', () => {
    expect(TestControllerService.normaliseId('file-Name-1.html')).toEqual('FILE-NAME-1.HTML');
    expect(TestControllerService.normaliseId('file-Name-2.1.1.html')).toEqual('FILE-NAME-2.1.1.HTML');
    expect(TestControllerService.normaliseId('file-Name3.html')).toEqual('FILE-NAME3.HTML');
    expect(TestControllerService.normaliseId('file-Name4.0.html')).toEqual('FILE-NAME4.0.HTML');
    expect(TestControllerService.normaliseId('file-Name5.0', 'html')).toEqual('FILE-NAME5.0.HTML');
    expect(TestControllerService.normaliseId('file-Name_6.gif', 'html')).toEqual('FILE-NAME_6.GIF.HTML');
    expect(TestControllerService.normaliseId('µðöþ7', 'html')).toEqual('ΜÐÖÞ7.HTML');
    expect(TestControllerService.normaliseId(' whatever  8.html')).toEqual('WHATEVER  8.HTML');
  });

  it('Incoming dataParts should be forwarded to backend buffered and filtered for changed parts', fakeAsync(() => {
    service.setUnitStateDataParts(1, {}); // redo subscription inside of fakeAsync
    service.testMode = new TestMode('hot');
    service.testId = '111';
    service.setupUnitStateBuffer();
    const u = TestControllerService.unitDataBufferMs;

    const expectedUploadedData: UnitStateData[] = [];

    service.updateUnitStateDataParts('unit1', 1, { a: 'initial A', b: 'initial B' }, 'aType');
    tick(u * 0.1);
    expect(uploadedData).withContext('Debounce DataParts forwarding').toEqual(expectedUploadedData);

    tick(u * 1.5);
    expectedUploadedData.push({
      unitDbKey: 'unit1',
      dataParts: { a: 'initial A', b: 'initial B' },
      unitStateDataType: 'aType'
    });
    expect(uploadedData).withContext('Debounce DataParts forwarding ii').toEqual(expectedUploadedData);

    service.updateUnitStateDataParts('unit1', 1, { a: 'initial A' }, 'aType');
    tick(u * 1.5);
    expect(uploadedData).withContext('Skip when nothing changes').toEqual(expectedUploadedData);

    service.updateUnitStateDataParts('unit1', 1, { a: 'new A', b: 'initial B' }, 'aType');
    tick(u * 0.1);
    service.updateUnitStateDataParts('unit1', 1, { b: 'initial B', c: 'used C the first time' }, 'aType');
    tick(u * 1.5);
    expectedUploadedData.push({
      unitDbKey: 'unit1',
      dataParts: { a: 'new A', c: 'used C the first time' },
      unitStateDataType: 'aType'
    });
    expect(uploadedData).withContext('Merge debounced changes').toEqual(expectedUploadedData);

    tick(u * 1.5);
    service.updateUnitStateDataParts('unit1', 1, { b: 'brand new B', c: 'brand new C' }, 'aType');
    tick(u * 0.1);
    service.updateUnitStateDataParts('unit2', 2, { b: 'skipThisB', c: 'TakeThisC' }, 'anotherType');
    service.updateUnitStateDataParts('unit2', 2, { b: 'andApplyThisB', c: 'TakeThisC' }, 'anotherType');
    tick(u * 1.5);
    expectedUploadedData.push({
      unitDbKey: 'unit1',
      dataParts: { b: 'brand new B', c: 'brand new C' },
      unitStateDataType: 'aType'
    }, {
      unitDbKey: 'unit2',
      dataParts: { b: 'andApplyThisB', c: 'TakeThisC' },
      unitStateDataType: 'anotherType'
    });
    expect(uploadedData)
      .withContext('when unitId changes debounce timer should be killed')
      .toEqual(expectedUploadedData);

    service.destroyUnitStateBuffer();
  }));
});
