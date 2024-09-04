import { Inject, Injectable } from '@angular/core';
import {
  BehaviorSubject, combineLatest, interval, Observable, of, Subject, zip
} from 'rxjs';
import { Sort } from '@angular/material/sort';
import {
  delay, filter, flatMap, map, startWith, switchMap, tap
} from 'rxjs/operators';
import { BackendService } from '../backend.service';
import { BookletService } from '../booklet/booklet.service';
import { TestSessionUtil } from '../test-session/test-session.util';
import {
  isBooklet,
  Selected,
  CheckingOptions,
  TestSession,
  TestSessionFilter,
  TestSessionSetStats,
  TestSessionsSuperStates,
  CommandResponse,
  GotoCommandData,
  GroupMonitorConfig, TestSessionFilterList
} from '../group-monitor.interfaces';
import { BookletUtil } from '../booklet/booklet.util';
import { GROUP_MONITOR_CONFIG } from '../group-monitor.config';

@Injectable()
export class TestSessionManager {
  sortBy$: Subject<Sort>;
  filters$: Subject<TestSessionFilter[]>;

  checkingOptions: CheckingOptions = {
    enableAutoCheckAll: false,
    autoCheckAll: false
  };

  private groupName: string = '';

  get sessions$(): Observable<TestSession[]> {
    return this._sessions$.asObservable();
  }

  get sessions(): TestSession[] {
    return this._sessions$.getValue();
  }

  get checked(): TestSession[] { // this is intentionally not an observable
    return Object.values(this._checked);
  }

  get sessionsStats$(): Observable<TestSessionSetStats> {
    return this._sessionsStats$.asObservable();
  }

  get checkedStats$(): Observable<TestSessionSetStats> {
    return this._checkedStats$.asObservable();
  }

  get commandResponses$(): Observable<CommandResponse> {
    return this._commandResponses$
      .pipe(
        filter(c => !!c)
      );
  }

  private monitor$: Observable<TestSession[]> = new Observable<TestSession[]>();
  private _sessions$: BehaviorSubject<TestSession[]> = new BehaviorSubject<TestSession[]>([]);
  private _checked: { [sessionTestSessionId: number]: TestSession } = {};
  private _checkedStats$: BehaviorSubject<TestSessionSetStats>;
  private _sessionsStats$: BehaviorSubject<TestSessionSetStats>;
  private _commandResponses$: Subject<CommandResponse> = new Subject<CommandResponse>();
  private _clock$: Observable<number>;

  // attention: this works the other way round than Array.filter:
  // it defines which sessions are to filter out, not which ones are to keep
  filterOptions: TestSessionFilterList = {
    locked: {
      selected: false,
      source: 'base',
      filter: {
        id: 'locked',
        label: 'gm_filter_locked',
        target: 'testState',
        value: 'status',
        subValue: 'locked',
        type: 'equal'
      }
    },
    pending: {
      selected: false,
      source: 'base',
      filter: {
        id: 'pending',
        label: 'gm_filter_pending',
        target: 'testState',
        value: 'status',
        subValue: 'pending',
        type: 'equal'
      }
    }
  };

  constructor(
    private bs: BackendService,
    private bookletService: BookletService,
    @Inject(GROUP_MONITOR_CONFIG) private readonly groupMonitorConfig: GroupMonitorConfig
  ) {
    this._checkedStats$ = new BehaviorSubject<TestSessionSetStats>(TestSessionManager.getEmptyStats());
    this._sessionsStats$ = new BehaviorSubject<TestSessionSetStats>(TestSessionManager.getEmptyStats());
    this.sortBy$ = new BehaviorSubject<Sort>({ direction: 'asc', active: 'personLabel' });
    this.filters$ = new BehaviorSubject<TestSessionFilter[]>([]);
    this._clock$ = this.groupMonitorConfig.checkForIdleInterval ?
      interval(this.groupMonitorConfig.checkForIdleInterval).pipe(startWith(0)) :
      of(0);
  }

  connect(groupName: string): void {
    this.groupName = groupName;
    this.sortBy$.next({ direction: 'asc', active: 'personLabel' });
    this.filters$.next([]);
    this.checkingOptions = {
      enableAutoCheckAll: true,
      autoCheckAll: true
    };

    this._checkedStats$.next(TestSessionManager.getEmptyStats());
    this._sessionsStats$.next(TestSessionManager.getEmptyStats());
    // this._commandResponses$.next();

    this.monitor$ = this.bs.observeSessionsMonitor(groupName)
      .pipe(
        switchMap(sessions => zip(
          ...sessions
            .map(session => combineLatest([this.bookletService.getBooklet(session.bookletName), this._clock$])
              .pipe(
                map(([booklet]) => TestSessionUtil.analyzeTestSession(session, booklet))
              )
            )
        ))
      );

    this._sessions$.next([]);

    combineLatest([this.sortBy$, this.filters$, this.monitor$])
      .pipe(
        // eslint-disable-next-line max-len
        map(([sortBy, filters, sessions]) => this.sortSessions(sortBy, TestSessionManager.filterSessions(sessions, filters))),
        tap(sessions => this.synchronizeChecked(sessions))
      )
      .subscribe(this._sessions$);
  }

  disconnect(): void {
    this.groupName = '';
    this.bs.cutConnection();
  }

  switchFilter(filterId: string): void {
    this.filterOptions[filterId].selected = !this.filterOptions[filterId].selected;
    this.refreshFilters();
  }

  refreshFilters(): void {
    console.log({
      filterOptions: this.filterOptions
    });
    this.filters$.next(Object.values(this.filterOptions)
      .filter(filterOption => filterOption.selected)
      .map(filterOption => filterOption.filter)
    );
  }

  private static filterSessions(sessions: TestSession[], filters: TestSessionFilter[]): TestSession[] {
    console.log({ filters });
    return sessions
      .filter(session => session.data.testId && session.data.testId > -1) // testsession without testId is deprecated
      .filter(session => TestSessionManager.applyFilters(session, filters));
  }

  private static applyFilters(session: TestSession, filters: TestSessionFilter[]): boolean {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const apply = (subject: string, filter: TestSessionFilter, inverted?: true): boolean => {
      if (filter.not && !inverted) return !apply(subject, filter, true);
      if (Array.isArray(filter.value)) return filter.value.includes(subject);
      switch (filter.type) {
        case 'substring': return subject.includes(filter.value);
        case 'equal': return subject === filter.value;
        case 'regex': return (new RegExp(filter.value)).test(subject);
        default: return false;
      }
    };
    return filters.reduce((keep: boolean, nextFilter: TestSessionFilter) => {
      switch (nextFilter.target) {
        case 'groupName':
        case 'personLabel':
        case 'mode':
        case 'bookletName':
          return keep && apply(session.data[nextFilter.target] || '', nextFilter);
        case 'bookletLabel':
          return keep && apply('metadata' in session.booklet ? session.booklet.metadata.label : '', nextFilter);
        case 'blockId':
          return keep && apply(session.current?.ancestor?.blockId || '', nextFilter);
        case 'testState': {
          if (Array.isArray(nextFilter.value)) return keep;
          const keyExists = (typeof session.data.testState[nextFilter.value] !== 'undefined');
          const valueMatches = keyExists && (session.data.testState[nextFilter.value] === nextFilter.subValue);
          const testStateMatching = (typeof nextFilter.subValue !== 'undefined') ? !valueMatches : !keyExists;
          return keep && (nextFilter.not ? !testStateMatching : testStateMatching);
        }
        case 'state': {
          return keep && apply(session.state, nextFilter);
        }
        case 'bookletSpecies': {
          return keep && apply(session.booklet.species || '', nextFilter);
        }
        default:
          return false;
      }
    }, true);
  }

  private static getEmptyStats(): TestSessionSetStats {
    return {
      ...{
        all: false,
        number: 0,
        differentBookletSpecies: 0,
        differentBooklets: 0,
        paused: 0,
        locked: 0
      }
    };
  }

  private synchronizeChecked(sessions: TestSession[]): void {
    const sessionsStats = TestSessionManager.getSessionSetStats(sessions);

    this.checkingOptions.enableAutoCheckAll = (sessionsStats.differentBookletSpecies < 2);

    if (!this.checkingOptions.enableAutoCheckAll) {
      this.checkingOptions.autoCheckAll = false;
    }

    const newCheckedSessions: { [sessionFullId: number]: TestSession } = {};
    sessions
      .forEach(session => {
        if (this.checkingOptions.autoCheckAll || (typeof this._checked[session.data.testId] !== 'undefined')) {
          newCheckedSessions[session.data.testId] = session;
        }
      });
    this._checked = newCheckedSessions;

    this._checkedStats$.next(TestSessionManager.getSessionSetStats(Object.values(this._checked), sessions.length));
    this._sessionsStats$.next(sessionsStats);
  }

  sortSessions(sort: Sort, sessions: TestSession[]): TestSession[] {
    return sessions
      .sort((session1, session2) => {
        const sortDirectionFactor = (sort.direction === 'asc' ? 1 : -1);
        if (sort.active === 'timestamp') {
          return (session1.data.timestamp - session2.data.timestamp) * sortDirectionFactor;
        }
        if (sort.active === '_checked') {
          const session1isChecked = this.isChecked(session1);
          const session2isChecked = this.isChecked(session2);
          if (!session1isChecked && session2isChecked) {
            return 1 * sortDirectionFactor;
          }
          if (session1isChecked && !session2isChecked) {
            return -1 * sortDirectionFactor;
          }
          return 0;
        }
        if (sort.active === '_superState') {
          return (TestSessionsSuperStates.indexOf(session1.state) -
            TestSessionsSuperStates.indexOf(session2.state)) * sortDirectionFactor;
        }
        if (sort.active === '_currentBlock') {
          const s1curBlock = session1.current?.ancestor?.blockId ?? 'zzzzzzzzzz';
          const s2curBlock = session2.current?.ancestor?.blockId ?? 'zzzzzzzzzz';
          return s1curBlock.localeCompare(s2curBlock) * sortDirectionFactor;
        }
        if (sort.active === '_currentUnit') {
          const s1currentUnit = session1.current?.unit?.label ?? 'zzzzzzzzzz';
          const s2currentUnit = session2.current?.unit?.label ?? 'zzzzzzzzzz';
          return s1currentUnit.localeCompare(s2currentUnit) * sortDirectionFactor;
        }
        let valA = session1.data[sort.active as keyof typeof session1.data] ?? 'zzzzzzzzzz';
        let valB = session2.data[sort.active as keyof typeof session2.data] ?? 'zzzzzzzzzz';
        if (typeof valA === 'number') {
          valA = valA.toString(10);
        }
        if (typeof valB === 'number') {
          valB = valB.toString(10);
        }
        if ((typeof valA === 'object') || (typeof valB === 'object')) {
          return 0;
        }
        return valA.localeCompare(valB) * sortDirectionFactor;
      });
  }

  testCommandPause(): void {
    const testIds = this.checked
      .filter(session => !TestSessionUtil.isPaused(session))
      .filter(session => !['pending', 'locked'].includes(session.state))
      .map(session => session.data.testId);
    if (!testIds.length) {
      this._commandResponses$.next({ commandType: 'pause', testIds });
      return;
    }
    this.bs.command('pause', [], testIds).subscribe(
      response => this._commandResponses$.next(response)
    );
  }

  testCommandResume(): void {
    const testIds = this.checked
      .filter(session => !['pending', 'locked'].includes(session.state))
      .map(session => session.data.testId);
    if (!testIds.length) {
      this._commandResponses$.next({ commandType: 'resume', testIds });
      return;
    }
    this.bs.command('resume', [], testIds).subscribe(
      response => this._commandResponses$.next(response)
    );
  }

  testCommandGoto(selection: Selected): Observable<true> {
    const gfd = TestSessionManager.groupForGoto(this.checked, selection);
    const allTestIds = this.checked.map(s => s.data.testId);
    return zip(
      ...Object.keys(gfd).map(key => this.bs.command('goto', ['id', gfd[key].firstUnitId], gfd[key].testIds))
    ).pipe(
      tap(() => {
        this._commandResponses$.next({
          commandType: 'goto',
          testIds: allTestIds
        });
      }),
      map(() => true)
    );
  }

  private static groupForGoto(sessionsSet: TestSession[], selection: Selected): GotoCommandData {
    const groupedByBooklet: GotoCommandData = {};
    sessionsSet.forEach(session => {
      if (
        session.data.bookletName &&
        !Object.keys(groupedByBooklet).includes(session.data.bookletName) &&
        isBooklet(session.booklet)
      ) {
        const firstUnit = selection.element?.blockId ?
          BookletUtil.getFirstUnitOfBlock(selection.element.blockId, session.booklet) :
          null;
        if (firstUnit) {
          groupedByBooklet[session.data.bookletName] = {
            testIds: [],
            firstUnitId: firstUnit.id
          };
        }
      }
      if (session.data.bookletName && Object.keys(groupedByBooklet).includes(session.data.bookletName)) {
        groupedByBooklet[session.data.bookletName].testIds.push(session.data.testId);
      }
    });
    return groupedByBooklet;
  }

  testCommandUnlock(): void {
    const testIds = this.checked
      .filter(TestSessionUtil.isLocked)
      .map(session => session.data.testId);
    if (!testIds.length) {
      this._commandResponses$.next({ commandType: 'unlock', testIds });
      return;
    }
    this.bs.unlock(this.groupName, testIds).subscribe(
      response => this._commandResponses$.next(response)
    );
  }

  // todo unit test
  commandFinishEverything(): Observable<CommandResponse> {
    const getUnlockedConnectedTestIds = () => Object.values(this._sessions$.getValue())
      .filter(session => !['pending', 'locked'].includes(session.state) &&
        !TestSessionUtil.hasState(session.data.testState, 'CONTROLLER', 'TERMINATED') &&
        (TestSessionUtil.hasState(session.data.testState, 'CONNECTION', 'POLLING') ||
          TestSessionUtil.hasState(session.data.testState, 'CONNECTION', 'WEBSOCKET')))
      .map(session => session.data.testId);
    const getUnlockedTestIds = () => Object.values(this._sessions$.getValue())
      .filter(session => session.data.testId > 0)
      .filter(session => !['pending', 'locked'].includes(session.state))
      .map(session => session.data.testId);

    this.filters$.next([]);

    return this.bs.command('terminate', ['lock'], getUnlockedConnectedTestIds())
      .pipe(
        delay(1500),
        flatMap(() => this.bs.lock(this.groupName, getUnlockedTestIds()))
      );
  }

  isChecked(session: TestSession): boolean {
    return (typeof this._checked[session.data.testId] !== 'undefined');
  }

  checkSessionsBySelection(selected: Selected): void {
    if (this.checkingOptions.autoCheckAll) {
      return;
    }
    let toCheck: TestSession[] = [];
    if (selected.element) {
      if (!selected.spreading) {
        toCheck = [...this.checked, selected.originSession];
      } else {
        toCheck = this._sessions$.getValue()
          .filter(session => (!['pending', 'locked'].includes(session.state)))
          .filter(session => (session.booklet.species === selected.originSession.booklet.species))
          .filter(session => (selected.inversion ? !this.isChecked(session) : true));
      }
    }

    this.replaceCheckedSessions(toCheck);
  }

  invertChecked(): void {
    if (this.checkingOptions.autoCheckAll) {
      return;
    }
    if (!this._sessions$) {
      return;
    }
    const unChecked = this._sessions$.getValue()
      .filter(session => session.data.testId && session.data.testId > -1)
      .filter(session => (!['pending', 'locked'].includes(session.state)))
      .filter(session => !this.isChecked(session));
    this.replaceCheckedSessions(unChecked);
  }

  checkSession(session: TestSession): void {
    if (this.checkingOptions.autoCheckAll) {
      return;
    }
    this._checked[session.data.testId] = session;
    this.onCheckedChanged();
  }

  uncheckSession(session: TestSession): void {
    if (this.checkingOptions.autoCheckAll) {
      return;
    }
    if (this.isChecked(session)) {
      delete this._checked[session.data.testId];
    }
    this.onCheckedChanged();
  }

  checkAll(): void {
    if (this.checkingOptions.autoCheckAll) {
      return;
    }
    const allSelectable = this._sessions$.getValue()
      .filter(session => (!['pending', 'locked'].includes(session.state)));
    this.replaceCheckedSessions(allSelectable);
  }

  checkNone(): void {
    this.replaceCheckedSessions([]);
  }

  private replaceCheckedSessions(sessionsToCheck: TestSession[]): void {
    const newCheckedSessions: { [testId: string]: TestSession } = {};
    sessionsToCheck
      .forEach(session => { newCheckedSessions[session.data.testId] = session; });
    this._checked = newCheckedSessions;
    this.onCheckedChanged();
  }

  private onCheckedChanged(): void {
    this._checkedStats$.next(TestSessionManager.getSessionSetStats(this.checked, this.sessions.length));
  }

  private static getSessionSetStats(sessionSet: TestSession[], all: number = sessionSet.length): TestSessionSetStats {
    const booklets = new Set();
    const bookletSpecies = new Set();
    let paused = 0;
    let locked = 0;

    sessionSet
      .forEach(session => {
        booklets.add(session.data.bookletName);
        bookletSpecies.add(session.booklet.species);
        if (TestSessionUtil.isPaused(session)) paused += 1;
        if (TestSessionUtil.isLocked(session)) locked += 1;
      });

    return {
      number: sessionSet.length,
      differentBooklets: booklets.size,
      differentBookletSpecies: bookletSpecies.size,
      all: (all === sessionSet.length),
      paused,
      locked
    };
  }
}
