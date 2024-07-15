// eslint-disable-next-line max-classes-per-file
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { Observable, of, Subscription } from 'rxjs';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import {
  KeyValuePairString, StateReportEntry, UnitDataParts, UnitStateKey, UnitStateUpdate
} from '../interfaces/test-controller.interfaces';
import { TestMode } from '../../shared/shared.module';
import { MessageService } from '../../shared/services/message.service';

const uploadedData: UnitDataParts[] = [];
const uploadedStates: UnitStateUpdate[] = [];

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  updateDataParts(
    testId: string, unitDbKey: string, dataParts: KeyValuePairString, unitStateDataType: string
  ): Observable<boolean> {
    uploadedData.push({ testId, unitAlias: unitDbKey, dataParts, unitStateDataType });
    return of(true);
  }

  // eslint-disable-next-line class-methods-use-this
  updateUnitState(testId: string, unitDbKey: string, state: UnitStateUpdate): Subscription {
    uploadedStates.push(state);
    return of(true).subscribe();
  }
}

let service: TestControllerService;

class MockMessageService {
  // eslint-disable-next-line class-methods-use-this
  showError(text: string): void {}
}

describe('TestControllerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestControllerService,
        {
          provide: BackendService,
          useValue: new MockBackendService()
        },
        {
          provide: MessageService,
          useValue: new MockMessageService()
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

  it('Incoming dataParts should be forwarded to backend buffered and filtered for changed parts', fakeAsync(() => {
    // service.setUnitStateDataParts(1, {}); // redo subscription inside of fakeAsync TODO X TEST
    service.testMode = new TestMode('run-hot-return');
    service.testId = '111';
    service.setupUnitDataPartsBuffer();
    const u = 6000;

    const expectedUploadedData: UnitDataParts[] = [];

    // // service.updateUnitStateDataParts('unit1', { a: 'initial A', b: 'initial B' }, 'aType');
    tick(u * 0.1);
    expect(uploadedData).withContext('Debounce DataParts forwarding').toEqual(expectedUploadedData);

    tick(u * 1.5);
    expectedUploadedData.push({
      testId: service.testId,
      unitAlias: 'unit1',
      dataParts: { a: 'initial A', b: 'initial B' },
      unitStateDataType: 'aType'
    });
    expect(uploadedData).withContext('Debounce DataParts forwarding ii').toEqual(expectedUploadedData);

    // // service.updateUnitStateDataParts('unit1', { a: 'initial A' }, 'aType');
    tick(u * 1.5);
    expect(uploadedData).withContext('Skip when nothing changes').toEqual(expectedUploadedData);

    // // service.updateUnitStateDataParts('unit1', { a: 'new A', b: 'initial B' }, 'aType');
    tick(u * 0.1);
    // // service.updateUnitStateDataParts('unit1', { b: 'initial B', c: 'used C the first time' }, 'aType');
    tick(u * 1.5);
    expectedUploadedData.push({
      testId: service.testId,
      unitAlias: 'unit1',
      dataParts: { a: 'new A', c: 'used C the first time' },
      unitStateDataType: 'aType'
    });
    expect(uploadedData).withContext('Merge debounced changes').toEqual(expectedUploadedData);

    tick(u * 1.5);
    // // service.updateUnitStateDataParts('unit1', { b: 'brand new B', c: 'brand new C' }, 'aType');
    tick(u * 0.1);
    // // service.updateUnitStateDataParts('unit2', { b: 'skipThisB', c: 'TakeThisC' }, 'anotherType');
    // // service.updateUnitStateDataParts('unit2', { b: 'andApplyThisB', c: 'TakeThisC' }, 'anotherType');
    tick(u * 1.5);
    expectedUploadedData.push({
      testId: service.testId,
      unitAlias: 'unit1',
      dataParts: { b: 'brand new B', c: 'brand new C' },
      unitStateDataType: 'aType'
    }, {
      testId: service.testId,
      unitAlias: 'unit2',
      dataParts: { b: 'andApplyThisB', c: 'TakeThisC' },
      unitStateDataType: 'anotherType'
    });
    expect(uploadedData)
      .withContext('when unitId changes debounce timer should be killed')
      .toEqual(expectedUploadedData);

    service.destroySubscription('unitDataBuffer');
  }));

  it('Incoming unitState should be forwarded to backend buffered and filtered for changed parts', fakeAsync(() => {
    // service.setUnitStateCurrentPage(1, '1'); TODO X TEST
    // service.setUnitPresentationProgress(1, 'none');
    // service.setUnitResponseProgress(1, 'none');
    service.testMode = new TestMode('run-hot-return');
    service.testId = '111';
    service.setupUnitStateBuffer();
    const u = 6000;

    const expectedUploadedStates: UnitStateUpdate[] = [];

    const state1: UnitStateUpdate = {
      testId: '1', unitAlias: 'unit1', state: [{ key: 'PRESENTATION_PROGRESS', content: 'some', timeStamp: Date.now() }]
    };
    // service.updateUnitState(1, state1);
    tick(u * 0.1);
    expect(uploadedStates).withContext('Debounce DataParts forwarding').toEqual(expectedUploadedStates);

    tick(u * 1.5);
    expectedUploadedStates.push(state1);
    expect(uploadedStates).withContext('Debounce DataParts forwarding ii').toEqual(expectedUploadedStates);

    const state2: UnitStateUpdate = {
      testId: '1', unitAlias: 'unit1', state: [{ key: 'PRESENTATION_PROGRESS', content: 'some', timeStamp: Date.now() }]
    };
    // service.updateUnitState(1, state2);
    tick(u * 1.5);
    expect(uploadedStates).withContext('Skip when nothing changes').toEqual(expectedUploadedStates);

    const stateEntry1: StateReportEntry<UnitStateKey> = { key: 'PRESENTATION_PROGRESS', content: 'complete', timeStamp: Date.now() };
    const stateEntry2: StateReportEntry<UnitStateKey> = { key: 'PLAYER', content: 'some player state', timeStamp: Date.now() };
    const stateEntry3: StateReportEntry<UnitStateKey> = { key: 'RESPONSE_PROGRESS', content: 'complete', timeStamp: Date.now() };
    // service.updateUnitState(1, { testId: '1', unitAlias: 'unit1', state: [stateEntry1, stateEntry2] });
    tick(u * 0.1);
    // service.updateUnitState(1, { testId: '1', unitAlias: 'unit1', state: [stateEntry3] });
    tick(u * 1.5);
    expectedUploadedStates.push({ testId: '1', unitAlias: 'unit1', state: [stateEntry1, stateEntry2, stateEntry3] });
    expect(uploadedStates).withContext('Merge debounced changes').toEqual(expectedUploadedStates);

    const unit1stateEntry: StateReportEntry<UnitStateKey> = { key: 'PLAYER', content: 'u1/s1', timeStamp: Date.now() };
    tick(u * 1.5);
    // service.updateUnitState(1, { testId: '1', unitAlias: 'unit1', state: [unit1stateEntry] });
    tick(u * 0.1);
    const unit2stateEntry: StateReportEntry<UnitStateKey> = { key: 'PLAYER', content: 'u2/s1', timeStamp: Date.now() };
    // service.updateUnitState(2, { testId: '1', unitAlias: 'unit2', state: [unit2stateEntry] });
    tick(u * 1.5);
    expectedUploadedStates.push(
      { testId: '1', unitAlias: 'unit1', state: [unit1stateEntry] },
      { testId: '1', unitAlias: 'unit2', state: [unit2stateEntry] }
    );
    expect(uploadedStates)
      .withContext('when unitId changes debounce timer should be killed')
      .toEqual(expectedUploadedStates);

    service.destroySubscription('unitStateBuffer');
  }));
});
