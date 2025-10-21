import {
  Component, Inject, OnInit
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  isBooklet,
  TestSessionFilter,
  TestSessionFilterTarget,
  testSessionFilterTargets,
  testSessionFilterTargetLists,
  testSessionFilterTypeLists,
  testSessionFilterTypes,
  TestSessionSuperState,
  isTestSessionFilter,
  isAdvancedTestSessionFilterTarget,
  isAdvancedTestSessionFilterType,
  TestSessionFilterSubValueSelect
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
    ],
    standalone: false
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
    unitId: [],
    bookletStates: []
  };

  readonly subValueLists:
  Partial<{ [field in TestSessionFilterTarget] : { [value: string] : TestSessionFilterSubValueSelect } }> =
      { bookletStates: {} };

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
        pushUnique(this.lists.blockId, session.current?.ancestor?.blockId || '');
        pushUnique(this.lists.blockLabel, session.current?.ancestor?.blockId || '');
        pushUnique(this.lists.bookletSpecies, session.booklet.species || '');
        pushUnique(this.lists.unitId, session.current?.unit?.id || '');
        pushUnique(this.lists.unitLabel, session.current?.unit?.label || '');
        if (!isBooklet(session.booklet)) return;
        pushUnique(this.lists.bookletLabel, session.booklet.metadata.label);
        Object.entries(session.booklet.states)
          .forEach(([stateId, state]) => {
            pushUnique(this.lists.bookletStates, stateId);
            if (!this.subValueLists.bookletStates) return;
            this.subValueLists.bookletStates[stateId] = {
              id: stateId,
              label: state.label, //!
              options: { ...state.options }
            };
          });
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
    if (['state'].includes(this.filter.target) && !this.isStringArray(this.filter.value)) {
      this.filter.value = [];
    }
    if (!['bookletStates', 'testState'].includes(this.filter.target)) {
      this.filter.subValue = undefined;
    }
    const newId = [
      this.filter.target,
      this.filter.not ? 'not_' : '',
      this.filter.type,
      ...(this.isStringArray(this.filter.value) ? this.filter.value : [this.filter.value]),
      this.filter.subValue
    ]
      .filter(t => !!t)
      .join('_');
    this.filter.id = this.originalId || newId;

    const label = {
      target: this.cts.getCustomText(`gm_filter_target_${this.filter.target}`) || this.filter.target,
      type: this.cts.getCustomText(`gm_filter_type_${this.filter.type}`) || this.filter.type,
      not: this.filter.not ? (this.cts.getCustomText('gm_filter_not') ?? 'not') : '',
      value: '',
      subValue: ''
    };
    if (this.isStringArray(this.filter.value)) {
      label.value = this.filter.value.join(', ');
    } else if (this.filter.subValue) {
      label.value = this.subValueLists?.[this.filter.target]?.[this.filter.value]?.label || this.filter.value;
      label.subValue =
        this.subValueLists?.[this.filter.target]?.[this.filter.value]?.options[this.filter.subValue]?.label ||
          this.filter.subValue;
    } else {
      label.value = this.filter.value;
    }
    this.filter.label = (
      this.filter.subValue ?
        [label.target, label.value, label.type, label.not, label.subValue] :
        [label.target, label.type, label.not, label.value]
    )
      .filter(a => !!a)
      .join(' ');
  }

  protected readonly isAdvancedTestSessionFilterTarget = isAdvancedTestSessionFilterTarget;
  protected readonly isAdvancedTestSessionFilterType = isAdvancedTestSessionFilterType;

  // eslint-disable-next-line class-methods-use-this
  protected readonly isStringArray = (s : string | string[]): s is string[] => Array.isArray(s);
}
