import {
  Component, Inject, OnInit
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  isBooklet,
  TestSessionFilter, TestSessionFilterTarget,
  testSessionFilterTargets, testSessionFilterTargetLists, testSessionFilterTypeLists,
  testSessionFilterTypes,
  TestSessionSuperState, isTestSessionFilter, isAdvancedTestSessionFilterTarget, isAdvancedTestSessionFilterType
} from '../../group-monitor.interfaces';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { superStates } from '../../test-session/super-states';
import { CustomtextService, TestMode } from '../../../shared/shared.module';
import { TestSessionManager } from '../../test-session-manager/test-session-manager.service';

@Component({
  templateUrl: './add-filter-dialog.component.html',
  styleUrls: [
    'add-filter-dialog.component.css'
  ]
})
export class AddFilterDialogComponent implements OnInit {
  constructor(
    public tsm: TestSessionManager,
    private cts: CustomtextService,
    @Inject(MAT_DIALOG_DATA) data: TestSessionFilter
  ) {
    if (data && isTestSessionFilter(data)) {
      this.originalId = data.id;
      this.filter = data;
    }
  }

  filter: TestSessionFilter = {
    id: '',
    label: '',
    target: 'personLabel',
    value: '',
    not: false,
    type: 'equal'
  };

  readonly targets = {
    basic: testSessionFilterTargetLists.basic,
    all: testSessionFilterTargets
  };

  readonly filterTypes = {
    basic: testSessionFilterTypeLists.basic,
    all: testSessionFilterTypes
  };

  readonly superStates = superStates as {
    [key in TestSessionSuperState]: {
      description: string;
      icon: string;
      tooltip: string;
      class: string;
    }
  };

  readonly lists: { [key in TestSessionFilterTarget]: string[] } = {
    blockId: [],
    blockLabel: [],
    bookletLabel: [],
    bookletId: [],
    bookletSpecies: [],
    groupName: [],
    mode: [],
    personLabel: [],
    state: [],
    testState: [],
    unitLabel: [],
    unitId: []
  };

  isValid: boolean = true;
  advancedMode: boolean = false;
  originalId: string | undefined;

  ngOnInit(): void {
    const pushUnique = <T>(arr: T[], item: T): void => {
      if (item && !arr.includes(item)) arr.push(item);
    };
    this.tsm.sessions
      .forEach(session => {
        pushUnique(this.lists.groupName, session.data.groupName);
        pushUnique(this.lists.bookletId, session.data.bookletName || '');
        if (isBooklet(session.booklet)) pushUnique(this.lists.bookletLabel, session.booklet.metadata.label);
        pushUnique(this.lists.blockId, session.current?.ancestor?.blockId || '');
        pushUnique(this.lists.blockLabel, session.current?.ancestor?.blockId || '');
        pushUnique(this.lists.bookletSpecies, session.booklet.species || '');
        pushUnique(this.lists.unitId, session.current?.unit?.id || '');
        pushUnique(this.lists.unitLabel, session.current?.unit?.label || '');
      });

    this.lists.mode = Object.keys(TestMode.modes).map(mode => mode.toLowerCase());
  }

  validate(): void {
    this.isValid = true;
    if (typeof this.filter.value !== 'string') {
      this.isValid = false;
      return;
    }
    if (this.filter.type === 'regex') {
      try {
        // eslint-disable-next-line no-new
        new RegExp(this.filter.value);
      } catch (e) {
        this.isValid = false;
      }
    }
  }

  updateFilterId(): void {
    if (!this.filter.value) return;
    this.filter.id = this.originalId ||
      `${this.filter.target}_${this.filter.not ? 'not_' : ''}${this.filter.type}_${this.filter.value}`;
    this.filter.label = [
      this.cts.getCustomText(`gm_filter_target_${this.filter.target}`) || this.filter.target,
      this.cts.getCustomText(`gm_filter_type_${this.filter.type}`) || this.filter.type,
      this.filter.not ? (this.cts.getCustomText('gm_filter_not') ?? 'not') : '',
      this.filter.value.length > 15 ? `${this.filter.value.slice(0, 14)}...` : this.filter.value
    ]
      .filter(a => !!a)
      .join(' ');
  }

  protected readonly isAdvancedTestSessionFilterTarget = isAdvancedTestSessionFilterTarget;
  protected readonly isAdvancedTestSessionFilterType = isAdvancedTestSessionFilterType;
}
