// eslint-disable-next-line max-classes-per-file
import {
  discardPeriodicTasks, fakeAsync, TestBed, tick
} from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { firstValueFrom, Observable, of } from 'rxjs';
import { MatDialogModule } from '@angular/material/dialog';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import {
  KeyValuePairString, NavigationLeaveRestrictionValue, StateReportEntry, Testlet, Unit,
  UnitDataParts, UnitStateKey, UnitStateUpdate
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

  // eslint-disable-next-line class-methods-use-this
  showInfoDialog(dialog: { title: string, content: string }): Observable<boolean> {
    return of(true);
  }

  // eslint-disable-next-line class-methods-use-this
  showSnackbar(text: string): void {}
}

describe('TestControllerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [RouterTestingModule,
        MatDialogModule],
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
        },
        provideHttpClient(withInterceptorsFromDi())
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

  it('should code aliased and derived variables in a subform with the current responses API', () => {
    service.units[1] = {
      ...service.units[1],
      variables: {
        answerOne: {
          id: 'answerOne',
          status: 'VALUE_CHANGED',
          value: 'first',
          subform: 'S1'
        },
        answerTwo: {
          id: 'answerTwo',
          status: 'VALUE_CHANGED',
          value: 'second',
          subform: 'S1'
        },
        total: {
          id: 'total',
          status: 'UNSET',
          value: null
        }
      },
      baseVariableIds: ['answerOne', 'answerTwo'],
      scheme: [{
        id: 'item-one',
        alias: 'answerOne',
        sourceType: 'BASE',
        codes: [{
          id: 1,
          type: 'FULL_CREDIT',
          score: 1,
          ruleSets: [{
            rules: [{
              method: 'MATCH',
              parameters: ['first']
            }]
          }]
        }]
      }, {
        id: 'item-two',
        alias: 'answerTwo',
        sourceType: 'BASE',
        codes: [{
          id: 1,
          type: 'FULL_CREDIT',
          score: 1,
          ruleSets: [{
            rules: [{
              method: 'MATCH',
              parameters: ['second']
            }]
          }]
        }]
      }, {
        id: 'total-internal',
        alias: 'total',
        sourceType: 'SUM_SCORE',
        deriveSources: ['item-one', 'item-two'],
        codes: [{
          id: 2,
          type: 'FULL_CREDIT',
          score: 2,
          ruleSets: [{
            rules: [{
              method: 'NUMERIC_MATCH',
              parameters: ['2']
            }]
          }]
        }]
      }]
    };

    service['codeVariables'](1);

    expect(service.units[1].variables.answerOne).toEqual({
      id: 'answerOne',
      status: 'CODING_COMPLETE',
      value: 'first',
      subform: 'S1',
      code: 1,
      score: 1
    });
    expect(service.units[1].variables.answerTwo).toEqual({
      id: 'answerTwo',
      status: 'CODING_COMPLETE',
      value: 'second',
      subform: 'S1',
      code: 1,
      score: 1
    });
    expect(service.units[1].variables.total).toEqual({
      id: 'total',
      status: 'CODING_COMPLETE',
      value: 2,
      subform: 'S1',
      code: 2,
      score: 2
    });
  });

  it('Incoming dataParts should be forwarded to backend buffered and filtered for changed parts', fakeAsync(() => {
    service.setupUnitDataPartsBuffer();
    service.testMode = new TestMode('run-hot-return');
    service.testId = '111';
    const u = 1000;

    const expectedUploadedData: UnitDataParts[] = [];

    service.AddToUnitStateDataPartsBuffer(1, { a: 'initial A', b: 'initial B' }, 'aType');
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

    service.AddToUnitStateDataPartsBuffer(1, { a: 'initial A' }, 'aType');
    tick(u * 1.5);
    expect(uploadedData).withContext('Skip when nothing changes').toEqual(expectedUploadedData);

    service.AddToUnitStateDataPartsBuffer(1, { a: 'new A', b: 'initial B' }, 'aType');
    tick(u * 0.1);
    service.AddToUnitStateDataPartsBuffer(1, { b: 'initial B', c: 'used C the first time' }, 'aType');
    tick(u * 1.5);
    expectedUploadedData.push({
      testId: service.testId,
      unitAlias: 'u1',
      dataParts: { a: 'new A', c: 'used C the first time' },
      unitStateDataType: 'aType'
    });

    expect(uploadedData).withContext('Merge debounced changes').toEqual(expectedUploadedData);

    tick(u * 1.5);
    service.AddToUnitStateDataPartsBuffer(1, { b: 'brand new B', c: 'brand new C' }, 'aType');
    tick(u * 0.1);

    // switch to unitSequenceId 2
    service.AddToUnitStateDataPartsBuffer(2, { b: 'skipThisB', c: 'TakeThisC' }, 'anotherType');
    service.AddToUnitStateDataPartsBuffer(2, { b: 'andApplyThisB', c: 'TakeThisC' }, 'anotherType');
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
    service.AddToUnitStateBuffer(1, state1);
    tick(u * 0.1);
    expect(uploadedStates).withContext('Debounce unitState forwarding').toEqual(expectedUploadedStates);

    tick(u * 1.5);
    expectedUploadedStates.push({ state: state1, testId: '111', unitAlias: 'u1' });
    expect(uploadedStates).withContext('Debounce unitState forwarding ii').toEqual(expectedUploadedStates);

    const state2: State[] = [{ key: 'PRESENTATION_PROGRESS', content: 'some', timeStamp: Date.now() }];
    service.AddToUnitStateBuffer(1, state2);
    tick(u * 1.5);
    expect(uploadedStates).withContext('Skip when nothing changes').toEqual(expectedUploadedStates);

    const stateEntry1: State = { key: 'PRESENTATION_PROGRESS', content: 'complete', timeStamp: Date.now() };
    const stateEntry2: State = { key: 'PLAYER', content: 'some player state', timeStamp: Date.now() };
    const stateEntry3: State = { key: 'RESPONSE_PROGRESS', content: 'complete', timeStamp: Date.now() };
    service.AddToUnitStateBuffer(1, [stateEntry1, stateEntry2]);
    tick(u * 0.1);
    service.AddToUnitStateBuffer(1, [stateEntry3]);
    tick(u * 1.5);
    expectedUploadedStates.push({ testId: '111', unitAlias: 'u1', state: [stateEntry1, stateEntry2, stateEntry3] });
    expect(uploadedStates).withContext('Merge debounced changes').toEqual(expectedUploadedStates);

    const unit1stateEntry: State = { key: 'PLAYER', content: 'u1/s1', timeStamp: Date.now() };
    tick(u * 1.5);
    service.AddToUnitStateBuffer(1, [unit1stateEntry]);
    tick(u * 0.1);

    // switch to unitsequenceid 2
    const unit2stateEntry: State = { key: 'PLAYER', content: 'u2/s1', timeStamp: Date.now() };
    service.AddToUnitStateBuffer(2, [unit2stateEntry])
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

  // The unit menu, the logo and the navigation buttons all end up in canDeactivateUnit(); which
  // restrictions apply comes from the testlet the current unit sits in.
  describe('leaving a unit with unfinished work', () => {
    const blockWith = (
      presentation: NavigationLeaveRestrictionValue,
      response: NavigationLeaveRestrictionValue
    ): Testlet => ({
      ...getTestData().Testlets.root,
      locked: null,
      timerId: null,
      restrictions: { denyNavigationOnIncomplete: { presentation, response } }
    });

    const unitIn = (block: Testlet, sequenceId: number, state: Unit['state'] = {}): Unit => ({
      ...getTestData().Units.u1,
      sequenceId,
      parent: block,
      state
    });

    // Navigating from the lower to the higher sequenceId is forward, the other way backward.
    const setUp = (current: Unit, target: Unit): void => {
      service.testMode = new TestMode('RUN-HOT-RESTART'); // one of the modes that enforce restrictions
      service.units = { [current.sequenceId]: current, [target.sequenceId]: target };
      service.currentUnitSequenceId = current.sequenceId;
    };

    it('denies navigating forward while the unit has not been presented completely', async () => {
      const block = blockWith('ON', 'OFF');
      const current = unitIn(block, 1, { PRESENTATION_PROGRESS: 'some' });
      setUp(current, unitIn(block, 5));
      const showInfoDialog = spyOn(TestBed.inject(MessageService), 'showInfoDialog').and.callThrough();

      expect(service.checkCompleteness(current, 'forward')).toEqual(['presentationIncomplete']);
      expect(await firstValueFrom(service.canDeactivateUnit('/t/1/u/5', false))).toBeFalse();
      expect(showInfoDialog).toHaveBeenCalledTimes(1);
    });

    it('allows navigating forward once the unit has been presented completely', async () => {
      const block = blockWith('ON', 'OFF');
      const current = unitIn(block, 1, { PRESENTATION_PROGRESS: 'complete' });
      setUp(current, unitIn(block, 5));
      const showInfoDialog = spyOn(TestBed.inject(MessageService), 'showInfoDialog').and.callThrough();

      expect(service.checkCompleteness(current, 'forward')).toEqual([]);
      expect(await firstValueFrom(service.canDeactivateUnit('/t/1/u/5', false))).toBeTrue();
      expect(showInfoDialog).not.toHaveBeenCalled();
    });

    it('restricts only forward navigation when the restriction is ON', () => {
      const block = blockWith('ON', 'OFF');
      const current = unitIn(block, 5, { PRESENTATION_PROGRESS: 'some' });
      setUp(current, unitIn(block, 1));

      expect(service.checkCompleteness(current, 'backward')).toEqual([]);
    });

    it('restricts backward navigation as well when the restriction is ALWAYS', () => {
      const block = blockWith('ALWAYS', 'OFF');
      const current = unitIn(block, 5, { PRESENTATION_PROGRESS: 'some' });
      setUp(current, unitIn(block, 1));

      expect(service.checkCompleteness(current, 'backward')).toEqual(['presentationIncomplete']);
    });

    it('denies navigating forward while the responses are incomplete', () => {
      const block = blockWith('OFF', 'ON');
      const current = unitIn(block, 1, { RESPONSE_PROGRESS: 'some' });
      setUp(current, unitIn(block, 5));

      expect(service.checkCompleteness(current, 'forward')).toEqual(['responsesIncomplete']);
    });

    it('does not restrict navigation out of a locked block', () => {
      const block = blockWith('ALWAYS', 'ALWAYS');
      block.locked = { by: 'time', through: block };
      const current = unitIn(block, 1, { PRESENTATION_PROGRESS: 'some', RESPONSE_PROGRESS: 'some' });
      setUp(current, unitIn(block, 5));

      expect(service.checkCompleteness(current, 'forward')).toEqual([]);
    });
  });
});
