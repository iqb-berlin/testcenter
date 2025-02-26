/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { Pipe } from '@angular/core';
import {
  Booklet, BookletError, CommandResponse, GroupMonitorConfig,
  Selected, Testlet, TestSessionData, TestSessionFilter, TestSessionSetStat, TestSessionSuperState
} from '../group-monitor.interfaces';
import { BookletService } from '../booklet/booklet.service';
import { BackendService } from '../backend.service';
import { TestSessionManager } from './test-session-manager.service';
import {
  unitTestExampleSessions, unitTestExampleBooklets, additionalUnitTestExampleSessions
} from '../unit-test-example-data.spec';
import { GROUP_MONITOR_CONFIG } from '../group-monitor.config';

class MockBookletService {
  booklets: Observable<Booklet>[] = [of(unitTestExampleBooklets.example_booklet_1)];

  getBooklet = (bookletName: string): Observable<Booklet | BookletError> => {
    if (!bookletName) {
      return of({ error: 'general', species: null });
    }

    if (unitTestExampleBooklets[bookletName]) {
      return of(unitTestExampleBooklets[bookletName]);
    }

    return of({ error: 'missing-file', species: null });
  };
}

class MockBackendService {
  observeSessionsMonitor(): Observable<TestSessionData[]> {
    return of([...unitTestExampleSessions, ...additionalUnitTestExampleSessions].map(s => s.data));
  }

  command(keyword: string, args: string[], testIds: number[]): Observable<CommandResponse> {
    return of({ commandType: keyword, testIds });
  }

  cutConnection(): void {}
}

@Pipe({ name: 'customtext' })
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MockCustomtextPipe {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(defaultValue: string, ..._: string[]): Observable<string> {
    return of<string>(defaultValue);
  }
}

describe('TestSessionManager', () => {
  let service: TestSessionManager;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [],
      providers: [
        TestSessionManager,
        { provide: BookletService, useValue: new MockBookletService() },
        { provide: BackendService, useValue: new MockBackendService() },
        { provide: GROUP_MONITOR_CONFIG, useValue: <GroupMonitorConfig>{ checkForIdleInterval: 0 } }
      ]
    })
      .compileComponents();
    service = TestBed.inject(TestSessionManager);
    service.connect('unit-test-group-name');
  }));

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('sortSessions', () => {
    it('should sort by bookletName alphabetically', () => {
      const sorted = service.sortSessions({ active: 'bookletName', direction: 'asc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => s.data.bookletName))
        .toEqual(['example_booklet_1', 'example_booklet_2', 'this_does_not_exist']);
    });

    it('should sort by bookletName alphabetically in reverse', () => {
      const sorted = service.sortSessions({ active: 'bookletName', direction: 'desc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => s.data.bookletName))
        .toEqual(['this_does_not_exist', 'example_booklet_2', 'example_booklet_1']);
    });

    it('should sort by personLabel alphabetically', () => {
      const sorted = service.sortSessions({ active: 'personLabel', direction: 'asc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => s.data.personLabel)).toEqual(['Person 1', 'Person 1', 'Person 2']);
    });

    it('should sort by personLabel alphabetically in reverse', () => {
      const sorted = service.sortSessions({ active: 'personLabel', direction: 'desc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => s.data.personLabel)).toEqual(['Person 2', 'Person 1', 'Person 1']);
    });

    it('should sort by timestamp', () => {
      const sorted = service.sortSessions({ active: 'timestamp', direction: 'asc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => s.data.timestamp)).toEqual([10000000, 10000300, 10000500]);
    });

    it('should sort by timestamp reverse', () => {
      const sorted = service.sortSessions({ active: 'timestamp', direction: 'desc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => s.data.timestamp)).toEqual([10000500, 10000300, 10000000]);
    });

    it('should sort by checked', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      service['replaceCheckedSessions']([unitTestExampleSessions[1]]);
      const sorted = service.sortSessions({ active: '_checked', direction: 'asc' }, [...unitTestExampleSessions]);
      expect(sorted[0].data.testId).toEqual(unitTestExampleSessions[1].data.testId);
    });

    it('should sort by checked reverse', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      service['replaceCheckedSessions']([unitTestExampleSessions[1]]);
      const sorted = service.sortSessions({ active: '_checked', direction: 'desc' }, [...unitTestExampleSessions]);
      expect(sorted[2].data.testId).toEqual(unitTestExampleSessions[1].data.testId);
    });

    it('should sort by superstate', () => {
      const sorted = service.sortSessions({ active: '_superState', direction: 'asc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => s.state)).toEqual(['pending', 'paused', 'idle']);
    });

    it('should sort by superstate reverse', () => {
      const sorted = service.sortSessions({ active: '_superState', direction: 'desc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => s.state)).toEqual(['idle', 'paused', 'pending']);
    });

    it('should sort by currentBlock', () => {
      const sorted = service.sortSessions({ active: '_currentBlock', direction: 'asc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => (s.current ? s.current.ancestor?.blockId : '--'))).toEqual(['block-1', 'block-3', '--']);
    });

    it('should sort by currentBlock reverse', () => {
      const sorted = service.sortSessions({ active: '_currentBlock', direction: 'desc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => (s.current ? s.current.ancestor?.blockId : '--'))).toEqual(['--', 'block-3', 'block-1']);
    });

    it('should sort by currentUnit label alphabetically', () => {
      const sorted = service.sortSessions({ active: '_currentUnit', direction: 'asc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => (s.current ? s.current.unit?.id : '--'))).toEqual(['unit-1', 'unit-10', '--']);
    });

    it('should sort by currentUnit label alphabetically reverse', () => {
      const sorted = service.sortSessions({ active: '_currentUnit', direction: 'desc' }, [...unitTestExampleSessions]);
      expect(sorted.map(s => (s.current ? s.current.unit?.id : '--'))).toEqual(['--', 'unit-10', 'unit-1']);
    });
  });

  describe('getSessionSetStats', () => {
    it('should fetch correct stats from sessions', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const result = TestSessionManager['getSessionSetStats'](unitTestExampleSessions, 2);
      const expectation: TestSessionSetStat = {
        numberOfSessions: 3,
        differentBooklets: 3,
        differentBookletSpecies: 3,
        allChecked: false,
        pausedSessions: 1,
        lockedSessions: 0,
        bookletStateLabels: { }
      };
      expect(expectation).toEqual(result);
    });
  });

  describe('filterSessions', () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const filterSessions = TestSessionManager['filterSessions'];
    const sessionsSet = [...unitTestExampleSessions];

    it('should filter the sessions array by various filters', () => {
      const keepOnlyBooklet1: TestSessionFilter = {
        id: 'removeEverythingButBooklet1',
        label: 'removeEverythingButBooklet1',
        target: 'bookletId',
        type: 'equal',
        value: 'example_booklet_1',
        not: true
      };
      let result = filterSessions(sessionsSet, [keepOnlyBooklet1]).map(s => s.data.testId);
      expect(result).toEqual([1]);

      const removeHotRunReturn: TestSessionFilter = {
        id: 'removeHotRunReturn',
        label: 'removeHotRunReturn',
        target: 'mode',
        type: 'equal',
        value: 'run-hot-return',
        not: false
      };
      result = filterSessions(sessionsSet, [removeHotRunReturn]).map(s => s.data.testId);
      expect(result).toEqual([3]);

      const removeStatusControllerRunning: TestSessionFilter = {
        id: 'removeStatusControllerRunning',
        label: 'removeStatusControllerRunning',
        type: 'equal',
        target: 'testState',
        value: 'CONTROLLER',
        subValue: 'RUNNING',
        not: false
      };
      result = filterSessions(sessionsSet, [removeStatusControllerRunning]).map(s => s.data.testId);
      expect(result).toEqual([2, 3]);

      const removeStatusControllerNotRunning: TestSessionFilter = {
        id: 'removeStatusControllerNotRunning',
        label: 'removeStatusControllerNotRunning',
        type: 'equal',
        target: 'testState',
        value: 'CONTROLLER',
        subValue: 'RUNNING',
        not: true
      };
      result = filterSessions(sessionsSet, [removeStatusControllerNotRunning]).map(s => s.data.testId);
      expect(result).toEqual([1]);

      const removePending: TestSessionFilter = {
        id: 'removePending',
        label: 'removePending',
        target: 'state',
        value: 'pending',
        type: 'equal',
        not: false
      };
      result = filterSessions(sessionsSet, [removePending]).map(s => s.data.testId);
      expect(result).toEqual([1, 2]);

      const removeAllButSpecies1: TestSessionFilter = {
        id: 'removeAllButSpecies1',
        label: 'removeAllButSpecies1',
        target: 'bookletSpecies',
        value: 'example-species-1',
        type: 'equal',
        not: false
      };
      result = filterSessions(sessionsSet, [removeAllButSpecies1]).map(s => s.data.testId);
      expect(result).toEqual([2, 3]);

      result = filterSessions(sessionsSet, [removeAllButSpecies1, removePending]).map(s => s.data.testId);
      expect(result).toEqual([2]);

      result = filterSessions(sessionsSet, [removeAllButSpecies1, removeStatusControllerRunning, removeHotRunReturn])
        .map(s => s.data.testId);
      expect(result).toEqual([3]);
    });

    it('should filter by regex', () => {
      const keepUnit1x: TestSessionFilter = {
        id: 'keepUnit1x',
        label: 'keepUnit1x',
        target: 'unitId',
        value: 'unit-1.*',
        type: 'regex',
        not: true
      };
      const result = filterSessions(sessionsSet, [keepUnit1x])
        .map(s => s.data.testId);
      expect(result).toEqual([1, 2]);
    });

    it('should filter by substring', () => {
      const keepBlockTestlet0: TestSessionFilter = {
        id: 'keepBlockTestlet0',
        label: 'keepBlockTestlet0',
        target: 'blockLabel',
        value: 'let-0',
        type: 'substring',
        not: true
      };
      const result = filterSessions(sessionsSet, [keepBlockTestlet0])
        .map(s => s.data.testId);
      expect(result).toEqual([2]);
    });

    it('should filter from a set of superstates', () => {
      const removeInactiveStates: TestSessionFilter = {
        id: 'removeInactiveStates',
        label: 'removeInactiveStates',
        target: 'state',
        value: <Array<TestSessionSuperState>>['connection_lost', 'error', 'focus_lost', 'locked', 'idle', 'pending'],
        type: 'equal',
        not: false
      };
      const result = filterSessions(sessionsSet, [removeInactiveStates])
        .map(s => s.data.testId);
      expect(result).toEqual([2]);
    });
  });

  describe('groupForGoto', () => {
    it('return a group for each booklet in set and the first unit in the selected block', () => {
      const selection: Selected = {
        element: <Testlet>unitTestExampleBooklets.example_booklet_1.units.children[3], // alf = block-2
        inversion: false,
        originSession: unitTestExampleSessions[0],
        nthClick: 'first'
      };
      const sessions = [...unitTestExampleSessions, ...additionalUnitTestExampleSessions];
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const result = TestSessionManager['groupForGoto'](sessions, selection);
      expect(result).toEqual({
        'unit-3': { ids: [1, 33], isClosed: undefined },
        'unit-1': { ids: [34], isClosed: undefined }
      });
      // explanation: 'block-2' is given in session 1,2 and 33. But in session 2 it's from example_booklet_2,
      // where it is empty , so there is no place to go. Session 34 with example_booklet_3 has the block,
      // but another first unit
    });
  });

  describe('checkSessionsBySelection', () => {
    it('should select all possible test-sessions after selecting a block when spreading is true', () => {
      service.checkSessionsBySelection({
        element: <Testlet>unitTestExampleBooklets.example_booklet_1.units.children[3], // alf = block-2
        inversion: false,
        originSession: unitTestExampleSessions[0],
        nthClick: 'second'
      });
      expect(service.checked.map(s => s.data.testId)).toEqual([1, 33, 34]);

      service.checkSessionsBySelection({
        element: <Testlet>unitTestExampleBooklets.example_booklet_2.units.children[0], // zoe = block-1
        inversion: false,
        originSession: unitTestExampleSessions[1],
        nthClick: 'second'
      });
      expect(service.checked.map(s => s.data.testId)).toEqual([2]);
    });

    it('should check the current test-session after selecting a block when spreading is false', () => {
      service.checkSessionsBySelection({
        element: <Testlet>unitTestExampleBooklets.example_booklet_1.units.children[3], // alf = block-2
        inversion: false,
        originSession: unitTestExampleSessions[0],
        nthClick: 'first'
      });
      expect(service.checked.map(s => s.data.testId)).toEqual([1]);
      service.checkSessionsBySelection({
        element: <Testlet>unitTestExampleBooklets.example_booklet_2.units.children[0], // zoe = block-1
        inversion: false,
        originSession: additionalUnitTestExampleSessions[0],
        nthClick: 'first'
      });
      expect(service.checked.map(s => s.data.testId)).toEqual([1, 33]);
    });

    it('should check possible test-sessions which where not checked before when inversion is true', () => {
      service.checkSessionsBySelection({
        element: <Testlet>unitTestExampleBooklets.example_booklet_1.units.children[3], // alf = block-2
        inversion: true,
        originSession: unitTestExampleSessions[0],
        nthClick: 'second'
      });
      // nothing is checked, inversion checks all possible
      expect(service.checked.map(s => s.data.testId)).toEqual([1, 33, 34]);

      service.checkSessionsBySelection({
        element: <Testlet>unitTestExampleBooklets.example_booklet_1.units.children[3], // alf = block-2
        inversion: true,
        originSession: unitTestExampleSessions[0],
        nthClick: 'second'
      });
      // all possible where checked, so nothing remains
      expect(service.checked.map(s => s.data.testId)).toEqual([]);

      // eslint-disable-next-line @typescript-eslint/dot-notation
      service['replaceCheckedSessions']([unitTestExampleSessions[0], additionalUnitTestExampleSessions[0]]);

      service.checkSessionsBySelection({
        element: <Testlet>unitTestExampleBooklets.example_booklet_1.units.children[3], // alf = block-2
        inversion: true,
        originSession: unitTestExampleSessions[0],
        nthClick: 'second'
      });
      // test 1 and test 33 where checked, so 4 will be the inversion
      expect(service.checked.map(s => s.data.testId)).toEqual([34]);
    });

    it('should ignore inversion, when spreading is set to false', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      service['replaceCheckedSessions']([unitTestExampleSessions[0], additionalUnitTestExampleSessions[0]]);
      service.checkSessionsBySelection({
        element: <Testlet>unitTestExampleBooklets.example_booklet_1.units.children[3], // alf = block-2
        inversion: true,
        originSession: unitTestExampleSessions[0],
        nthClick: 'first'
      });
      expect(service.checked.map(s => s.data.testId)).toEqual([1, 33]);
    });
  });
});
