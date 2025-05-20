// eslint-disable-next-line max-classes-per-file
import {
  discardPeriodicTasks, fakeAsync, TestBed, tick
} from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MatDialogModule } from '@angular/material/dialog';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import {
  KeyValuePairString, StateReportEntry, UnitDataParts, UnitStateKey, UnitStateUpdate
} from '../interfaces/test-controller.interfaces';
import { MainDataService, TestMode } from '../../shared/shared.module';
import { MessageService } from '../../shared/services/message.service';
import { MockMainDataService } from '../test/mock-mds.service';
import { getTestData, getTestBookletConfig } from '../test/test-data';

const TestBookletConfig = getTestBookletConfig();
const TestData = getTestData();

const uploadedData: UnitDataParts[] = [];
const uploadedStates: UnitStateUpdate[] = [];

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  updateDataParts(
    testId: string, unitDbKey: string, originalUnitId: string, dataParts: KeyValuePairString, unitStateDataType: string
  ): Observable<boolean> {
    uploadedData.push({
      testId, unitAlias: unitDbKey, dataParts, unitStateDataType
    });
    return of(true);
  }

  // eslint-disable-next-line class-methods-use-this
  patchUnitState(stateUpdate: UnitStateUpdate, originalUnitId: string): Observable<void> {
    uploadedStates.push(stateUpdate);
    return of();
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
        },
        {
          provide: MainDataService,
          useValue: new MockMainDataService()
        }
      ],
      imports: [
        RouterTestingModule,
        HttpClientModule,
        MatDialogModule
      ]
    })
      .compileComponents();
    service = TestBed.inject(TestControllerService);
    service.booklet = {
      customTexts: {},
      metadata: {
        id: '',
        label: '',
        description: ''
      },
      states: {},
      units: {
        blockLabel: '',
        locks: {
          show: false,
          time: false,
          code: false,
          afterLeave: false
        },
        locked: null,
        timerId: null,
        id: '',
        label: '',
        restrictions: { },
        children: []
      },
      config: TestBookletConfig
    };
    service.currentUnitSequenceId = 1;
    service.units = {
      1: TestData.Units.u1,
      2: TestData.Units.u2
    };
    service.unitAliasMap = {
      u1: 1,
      u2: 2
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('Incoming dataParts should be forwarded to backend buffered and filtered for changed parts', fakeAsync(() => {
    service.setupUnitDataPartsBuffer();
    service.testMode = new TestMode('run-hot-return');
    service.testId = '111';
    const u = 1000;

    const expectedUploadedData: UnitDataParts[] = [];

    service.updateUnitStateDataParts(1, { a: 'initial A', b: 'initial B' }, 'aType');
    tick(u * 0.1);
    expect(uploadedData).withContext('Debounce DataParts forwarding').toEqual(expectedUploadedData);

    tick(u * 1.5);
    expectedUploadedData.push({
      testId: service.testId,
      unitAlias: 'u1',
      dataParts: { a: 'initial A', b: 'initial B' },
      unitStateDataType: 'aType'
    });
    expect(uploadedData).withContext('Debounce DataParts forwarding ii').toEqual(expectedUploadedData);

    service.updateUnitStateDataParts(1, { a: 'initial A' }, 'aType');
    tick(u * 1.5);
    expect(uploadedData).withContext('Skip when nothing changes').toEqual(expectedUploadedData);

    service.updateUnitStateDataParts(1, { a: 'new A', b: 'initial B' }, 'aType');
    tick(u * 0.1);
    service.updateUnitStateDataParts(1, { b: 'initial B', c: 'used C the first time' }, 'aType');
    tick(u * 1.5);
    expectedUploadedData.push({
      testId: service.testId,
      unitAlias: 'u1',
      dataParts: { a: 'new A', c: 'used C the first time' },
      unitStateDataType: 'aType'
    });

    expect(uploadedData).withContext('Merge debounced changes').toEqual(expectedUploadedData);

    tick(u * 1.5);
    service.updateUnitStateDataParts(1, { b: 'brand new B', c: 'brand new C' }, 'aType');
    tick(u * 0.1);

    // switch to unitSequenceId 2
    service.updateUnitStateDataParts(2, { b: 'skipThisB', c: 'TakeThisC' }, 'anotherType');
    service.updateUnitStateDataParts(2, { b: 'andApplyThisB', c: 'TakeThisC' }, 'anotherType');
    tick(u * 1.5);
    expectedUploadedData.push({
      testId: service.testId,
      unitAlias: 'u1',
      dataParts: { b: 'brand new B', c: 'brand new C' },
      unitStateDataType: 'aType'
    }, {
      testId: service.testId,
      unitAlias: 'u2',
      dataParts: { b: 'andApplyThisB', c: 'TakeThisC' },
      unitStateDataType: 'anotherType'
    });
    expect(uploadedData)
      .withContext('when unitId changes debounce timer should be killed')
      .toEqual(expectedUploadedData);
    discardPeriodicTasks();
  }));

  it('Incoming unitState should be forwarded to backend buffered and filtered for changed parts', fakeAsync(() => {
    // console.log('A');
    // uploadedData.forEach(row => console.log(JSON.stringify(row.dataParts)));
    // console.log('B');
    service.setupUnitStateBuffer();
    service.testMode = new TestMode('run-hot-return');
    service.testId = '111';
    const u = 3000;

    const expectedUploadedStates: UnitStateUpdate[] = [];

    type State = StateReportEntry<UnitStateKey>;

    const state1: State[] = [{ key: 'PRESENTATION_PROGRESS', content: 'some', timeStamp: Date.now() }];
    service.updateUnitState(1, state1);
    tick(u * 0.1);
    expect(uploadedStates).withContext('Debounce unitState forwarding').toEqual(expectedUploadedStates);

    tick(u * 1.5);
    expectedUploadedStates.push({ state: state1, testId: '111', unitAlias: 'u1' });
    expect(uploadedStates).withContext('Debounce unitState forwarding ii').toEqual(expectedUploadedStates);

    const state2: State[] = [{ key: 'PRESENTATION_PROGRESS', content: 'some', timeStamp: Date.now() }];
    service.updateUnitState(1, state2);
    tick(u * 1.5);
    expect(uploadedStates).withContext('Skip when nothing changes').toEqual(expectedUploadedStates);

    const stateEntry1: State = { key: 'PRESENTATION_PROGRESS', content: 'complete', timeStamp: Date.now() };
    const stateEntry2: State = { key: 'PLAYER', content: 'some player state', timeStamp: Date.now() };
    const stateEntry3: State = { key: 'RESPONSE_PROGRESS', content: 'complete', timeStamp: Date.now() };
    service.updateUnitState(1, [stateEntry1, stateEntry2]);
    tick(u * 0.1);
    service.updateUnitState(1, [stateEntry3]);
    tick(u * 1.5);
    expectedUploadedStates.push({ testId: '111', unitAlias: 'u1', state: [stateEntry1, stateEntry2, stateEntry3] });
    expect(uploadedStates).withContext('Merge debounced changes').toEqual(expectedUploadedStates);

    const unit1stateEntry: State = { key: 'PLAYER', content: 'u1/s1', timeStamp: Date.now() };
    tick(u * 1.5);
    service.updateUnitState(1, [unit1stateEntry]);
    tick(u * 0.1);

    // switch to unitsequenceid 2
    const unit2stateEntry: State = { key: 'PLAYER', content: 'u2/s1', timeStamp: Date.now() };
    service.updateUnitState(2, [unit2stateEntry])
    tick(u * 1.5);
    expectedUploadedStates.push(
      { testId: '111', unitAlias: 'u1', state: [unit1stateEntry] },
      { testId: '111', unitAlias: 'u2', state: [unit2stateEntry] }
    );
    expect(uploadedStates)
      .withContext('when unitId changes debounce timer should be killed')
      .toEqual(expectedUploadedStates);

    discardPeriodicTasks();
  }));
});
