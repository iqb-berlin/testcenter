import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { MatSidenav } from '@angular/material/sidenav';
import {
  interval, Observable, of, Subscription
} from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { catchError, switchMap } from 'rxjs/operators';
import { KeyValue } from '@angular/common';
import {
  ConfirmDialogComponent, ConfirmDialogData, CustomtextService, ConnectionStatus,
  MainDataService
} from '../shared/shared.module';
import { BackendService } from './backend.service';
import {
  TestViewDisplayOptions,
  TestViewDisplayOptionKey,
  Selected,
  TestSession,
  TestSessionSetStat,
  CommandResponse,
  UIMessage,
  isBooklet,
  TestSessionFilter,
  TestSessionFilterListEntry,
  testSessionFilterListEntrySources, Profile, isColumnOption, isViewOption, isYesNoOption
} from './group-monitor.interfaces';
import { TestSessionManager } from './test-session-manager/test-session-manager.service';
import { BookletUtil } from './booklet/booklet.util';
import { AddFilterDialogComponent } from './components/add-filter-dialog/add-filter-dialog.component';
import {
  TimeRestrictionDialogComponent,
  TimeRestrictionDialogData
} from './time-restriction-dialog/time-restriction-dialog.component';
import { ComponentUtilService } from '../shared/services/component-util.service';

@Component({
  selector: 'tc-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: [
    '../../monitor-layout.css',
    './group-monitor.component.css'
  ]
})
export class GroupMonitorComponent implements OnInit, OnDestroy {
  connectionStatus$: Observable<ConnectionStatus> | null = null;

  groupLabel = '';

  currentlySelected: Selected | null = null;
  CurrentlyMarked: Selected | null = null;

  displayOptions: TestViewDisplayOptions = {
    view: 'medium',
    groupColumn: 'hide',
    bookletColumn: 'show',
    blockColumn: 'show',
    unitColumn: 'hide',
    bookletStatesColumns: [],
    highlightSpecies: false,
    manualChecking: false,
    autoselectNextBlock: true
  };

  isScrollable = false;
  isClosing = false;

  quickFilter: string = '';
  quickFilterBoxOpen: boolean = false;

  messages: UIMessage[] = [];

  bookletStates: { [p: string]: string } = {};

  private subscriptions: Subscription[] = [];

  @ViewChild('adminbackground') mainElem!: ElementRef;
  @ViewChild('sidenav', { static: true }) sidenav!: MatSidenav;

  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private bs: BackendService,
    public tsm: TestSessionManager,
    private router: Router,
    private cts: CustomtextService,
    public mds: MainDataService,
    private addFilterDialog: MatDialog,
    private componentUtilService: ComponentUtilService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe(params => {
        this.groupLabel = this.mds.getAccessObject('testGroupMonitor', params['group-name']).label;
        const profileId = params['profile-id'];
        if (profileId) {
          this.bs.getProfile(profileId).subscribe(profile => this.applyProfile(profile));
        }
        this.tsm.connect(params['group-name']);
      }),
      this.tsm.sessionsStats$.subscribe(stats => {
        this.onSessionsUpdate(stats);
      }),
      this.tsm.checkedStats$.subscribe(stats => {
        this.onCheckedChange(stats);
      }),
      this.tsm.commandResponses$.subscribe(commandResponse => {
        this.messages.push(this.commandResponseToMessage(commandResponse));
      }),
      this.tsm.commandResponses$
        .pipe(switchMap(() => interval(7000)))
        .subscribe(() => { this.messages.shift(); })
    ];

    this.connectionStatus$ = this.bs.connectionStatus$;
    this.mds.appSubTitle$.next(this.cts.getCustomText('gm_headline') ?? '');
    this.tsm.resetFilters();
  }

  private commandResponseToMessage(commandResponse: CommandResponse): UIMessage {
    const command = this.cts.getCustomText(`gm_control_${commandResponse.commandType}`) || commandResponse.commandType;
    const successWarning = this.cts.getCustomText(`gm_control_${commandResponse.commandType}_success_warning`) || '';
    if (!commandResponse.testIds.length) {
      return {
        level: 'warning',
        text: 'Keine Tests Betroffen von: `%s`',
        customtext: 'gm_message_no_session_affected_by_command',
        replacements: [command, commandResponse.testIds.length.toString(10)]
      };
    }
    return {
      level: successWarning ? 'warning' : 'info',
      text: '`%s` an `%s` tests gesendet! %s',
      customtext: 'gm_message_command_sent_n_sessions',
      replacements: [command, commandResponse.testIds.length.toString(10), successWarning]
    };
  }

  ngOnDestroy(): void {
    this.tsm.disconnect();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  ngAfterViewChecked(): void {
    this.isScrollable = this.mainElem.nativeElement.clientHeight < this.mainElem.nativeElement.scrollHeight;
  }

  private onSessionsUpdate(stats: TestSessionSetStat): void {
    this.displayOptions.highlightSpecies = (stats.differentBookletSpecies > 1);

    if (!this.tsm.checkingOptions.enableAutoCheckAll) {
      this.displayOptions.manualChecking = true;
    }

    this.bookletStates = stats.bookletStateLabels;
  }

  private onCheckedChange(stats: TestSessionSetStat): void {
    if (stats.differentBookletSpecies > 1) {
      this.currentlySelected = null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  trackSession = (index: number, session: TestSession): number => session.data.testId;

  setTableSorting(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      return;
    }
    this.tsm.sortBy$?.next(sort);
  }

  setDisplayOption(option: TestViewDisplayOptionKey, value: TestViewDisplayOptions[TestViewDisplayOptionKey]): void {
    if (Object.keys(this.displayOptions).includes(option)) {
      (this.displayOptions as {
        [option in TestViewDisplayOptionKey]: TestViewDisplayOptions[TestViewDisplayOptionKey]
      })[option] = value;
    }
  }

  toggleBookletStatesColumn(column: string): void {
    this.displayOptions.bookletStatesColumns =
      (this.displayOptions.bookletStatesColumns.includes(column)) ?
        this.displayOptions.bookletStatesColumns.filter(c => c !== column) :
        [...this.displayOptions.bookletStatesColumns, column].sort();
  }

  scrollDown(): void {
    this.mainElem.nativeElement.scrollTo(0, this.mainElem.nativeElement.scrollHeight);
  }

  updateScrollHint(): void {
    const elem = this.mainElem.nativeElement;
    const reachedBottom = (elem.scrollTop + elem.clientHeight === elem.scrollHeight);
    elem.classList[reachedBottom ? 'add' : 'remove']('hide-scroll-hint');
  }

  getSessionColor(session: TestSession): string {
    const stripes = (c1: string, c2: string) => `repeating-linear-gradient(45deg, ${c1}, ${c1} 10px, ${c2} 10px, ${c2} 20px)`;
    const hsl = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`;
    const colorful = this.displayOptions.highlightSpecies && session.booklet.species;
    const h = colorful ? (
      session.booklet.species.length *
      session.booklet.species.charCodeAt(0) *
      session.booklet.species.charCodeAt(session.booklet.species.length / 4) *
      session.booklet.species.charCodeAt(session.booklet.species.length / 4) *
      session.booklet.species.charCodeAt(session.booklet.species.length / 2) *
      session.booklet.species.charCodeAt(3 * (session.booklet.species.length / 4)) *
      session.booklet.species.charCodeAt(session.booklet.species.length - 1)
    ) % 360 : 0;

    switch (session.state) {
      case 'paused':
        return hsl(h, colorful ? 45 : 0, 90);
      case 'pending':
      case 'locked':
        return stripes(hsl(h, colorful ? 75 : 0, 95), hsl(0, 0, 92));
      case 'error':
        return stripes(hsl(h, colorful ? 75 : 0, 95), hsl(0, 30, 95));
      default:
        return hsl(h, colorful ? 75 : 0, colorful ? 95 : 100);
    }
  }

  markElement(marking: Selected): void {
    this.CurrentlyMarked = marking;
  }

  selectElement(selected: Selected): void {
    this.tsm.checkSessionsBySelection(selected);
    this.currentlySelected = selected;
  }

  finishEverythingCommand(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: 'auto',
      data: <ConfirmDialogData>{
        title: 'Testdurchführung Beenden',
        content: 'Achtung! Diese Aktion sperrt und beendet sämtliche Tests dieser Sitzung.',
        confirmbuttonlabel: 'Ja, ich möchte die Testdurchführung Beenden',
        showcancel: true
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isClosing = true;
        this.tsm.commandFinishEverything()
          .pipe(catchError(err => {
            this.isClosing = false;
            throw err;
          }))
          .subscribe(() => {
            setTimeout(() => { this.router.navigateByUrl('/r/login'); }, 2000);
          });
      }
    });
  }

  testCommandGoto(): void {
    if (!this.currentlySelected?.element?.blockId) {
      this.messages.push({
        level: 'warning',
        customtext: 'gm_test_command_no_selected_block',
        text: 'Kein Zielblock ausgewählt'
      });
      return;
    }

    (this.tsm.checked
      .some(testSession => isBooklet(testSession.booklet) &&
          this.currentlySelected?.element &&
          testSession.timeLeft &&
          (testSession.timeLeft[this.currentlySelected?.element?.id] <= 0)
      ) ?
      this.dialog.open(
        TimeRestrictionDialogComponent, {
          width: 'auto',
          data: <TimeRestrictionDialogData>{
            title:
                this.cts.getCustomText('gm_control_goto_unlock_blocks_confirm_headline'),
            content:
                this.cts.getCustomText('gm_control_goto_unlock_blocks_confirm_text'),
            confirmbuttonlabel: 'OK',
            showcancel: true,
            remainingTime: this.tsm.getMaxTimeAcrossAllSessions(this.currentlySelected)
          }
        }
      ).afterClosed() :
      of(1) // 1 as in 'true'
    )
      .subscribe((confirmed?: number | boolean) => {
        if (!confirmed || confirmed === 0 || !this.currentlySelected) return;
        const newTimeLeft = confirmed as number;
        this.tsm.testCommandGoto(this.currentlySelected, newTimeLeft)
          .subscribe(() => this.selectNextBlock());
      });
  }

  private selectNextBlock(): void {
    if (!this.displayOptions.autoselectNextBlock) return;
    if (!this.currentlySelected) return;
    if (!isBooklet(this.currentlySelected.originSession.booklet)) return;
    this.currentlySelected = {
      element: this.currentlySelected.element?.nextBlockId ?
        BookletUtil.getBlockById(
          this.currentlySelected.element.nextBlockId,
          this.currentlySelected.originSession.booklet
        ) : null,
      inversion: false,
      originSession: this.currentlySelected.originSession,
      nthClick: this.currentlySelected.nthClick
    };
  }

  unlockCommand(): void {
    this.tsm.testCommandUnlock();
  }

  toggleChecked(session: TestSession): void {
    if (!this.tsm.isChecked(session)) {
      this.tsm.checkSession(session);
    } else {
      if (session.data.testId === this.currentlySelected?.originSession?.data?.testId) {
        this.currentlySelected = null;
      }
      this.tsm.uncheckSession(session);
    }
  }

  invertChecked(event: Event): boolean {
    event.preventDefault();
    this.tsm.invertChecked();
    return false;
  }

  toggleAlwaysCheckAll(event: MatSlideToggleChange): void {
    if (this.tsm.checkingOptions.enableAutoCheckAll && event.checked) {
      // TODO not ideal - try to reset the state properly, instead of reloading the component
      this.componentUtilService.reloadComponent(true);
    } else {
      this.tsm.checkNone();
      this.displayOptions.manualChecking = true;
      this.tsm.checkingOptions.autoCheckAll = false;
      this.currentlySelected = null;
    }
  }

  toggleCheckAll(event: MatCheckboxChange): void {
    if (event.checked) {
      this.tsm.checkAll();
    } else {
      this.tsm.checkNone();
      this.currentlySelected = null;
    }
  }

  addFilter(): void {
    this.openFilterDialog();
  }

  editFilter(key: string): void {
    this.openFilterDialog(this.tsm.filterOptions[key]);
  }

  private openFilterDialog(filterEntry: TestSessionFilterListEntry | undefined = undefined) {
    const data = filterEntry ? filterEntry.filter : {};
    const dialogRef = this.addFilterDialog.open(AddFilterDialogComponent, { width: 'auto', data });

    dialogRef.afterClosed().subscribe((newFilter: TestSessionFilter) => {
      if (!newFilter) return;
      this.tsm.filterOptions[newFilter.id] = {
        selected: true,
        filter: newFilter,
        source: filterEntry?.source || 'custom'
      };
      this.tsm.refreshFilters();
    });
  }

  // eslint-disable-next-line class-methods-use-this
  sortFilterMenuEntries(
    a: KeyValue<string, TestSessionFilterListEntry>,
    b: KeyValue<string, TestSessionFilterListEntry>
  ): number {
    const aLevel = testSessionFilterListEntrySources.indexOf(a.value.source);
    const bLevel = testSessionFilterListEntrySources.indexOf(b.value.source);
    if (aLevel !== bLevel) return aLevel - bLevel;
    return a.value.filter.label > b.value.filter.label ? 1 : -1;
  }

  quickFilterOnUpdateModel() {
    if (!this.quickFilter) {
      this.tsm.filterOptions.quick.selected = false;
    } else {
      this.tsm.filterOptions.quick.selected = true;
      this.tsm.filterOptions.quick.filter.value = this.quickFilter;
    }

    this.tsm.refreshFilters();
  }

  toggleQuickFilterBox(): void {
    this.quickFilterBoxOpen = !this.quickFilterBoxOpen;
  }

  quickFilterOnFocusOut(): void {
    if (!this.quickFilter) this.quickFilterBoxOpen = false;
  }

  private applyProfile(p: Profile): void {
    if (isColumnOption(p.settings.blockColumn)) this.displayOptions.blockColumn = p.settings.blockColumn;
    if (isColumnOption(p.settings.unitColumn)) this.displayOptions.unitColumn = p.settings.unitColumn;
    if (isColumnOption(p.settings.groupColumn)) this.displayOptions.groupColumn = p.settings.groupColumn;
    if (isColumnOption(p.settings.bookletColumn)) this.displayOptions.bookletColumn = p.settings.bookletColumn;
    if (isViewOption(p.settings.view)) this.displayOptions.view = p.settings.view;
    if (isYesNoOption(p.settings.autoselectNextBlock)) this.displayOptions.autoselectNextBlock = p.settings.autoselectNextBlock !== 'no';

    (p.filters || [])
      .forEach((filter: TestSessionFilter, index: number) => {
        filter.id = `profile_filter:${index}`;
        this.tsm.filterOptions[filter.id] = { selected: true, filter, source: 'profile' };
      });

    this.displayOptions.bookletStatesColumns = (p.settings.bookletStatesColumns || '').split(/[\W,]+/);

    Object.entries(p.filtersEnabled || [])
      .forEach(([f, onOff]) => {
        if (this.tsm.filterOptions[f]) {
          this.tsm.filterOptions[f].selected = ['1', 'true', 'on', 'yes'].includes(onOff);
        }
      });
    this.tsm.refreshFilters();
  }
}
