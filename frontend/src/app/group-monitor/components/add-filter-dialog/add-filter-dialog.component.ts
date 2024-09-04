import {
  Component, Inject, OnInit
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  isBooklet,
  TestSessionFilter, TestSessionFilterTarget,
  testSessionFilterTargets,
  testSessionFilterTypes,
  TestSessionSuperState
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
    @Inject(MAT_DIALOG_DATA) filterToEdit: TestSessionFilter
  ) {
    console.log({ filterToEdit });
    if (filterToEdit) {
      this.originalId = filterToEdit.id;
      this.filter = filterToEdit;
    }
  }

  filter: TestSessionFilter = {
    id: '',
    label: '',
    target: 'mode',
    value: '',
    not: true,
    type: 'substring'
  };

  originalId: string | undefined;
  targets = testSessionFilterTargets;
  filterTypes = testSessionFilterTypes;
  superStates = superStates as {
    [key in TestSessionSuperState]: {
      description: string;
      icon: string;
      tooltip: string;
      class: string;
    }
  };

  lists: { [key in TestSessionFilterTarget]: string[] } = {
    mode: [],
    groupName: [],
    bookletName: [],
    bookletLabel: [],
    blockId: [],
    blockLabel: [],
    testState: [],
    state: [],
    bookletSpecies: [],
    personLabel: []
  };

  ngOnInit(): void {
    const pushUnique = <T>(arr: T[], item: T): void => {
      if (!arr.includes(item)) arr.push(item);
    };
    this.tsm.sessions
      .forEach(session => {
        pushUnique(this.lists.groupName, session.data.groupName);
        pushUnique(this.lists.bookletName, session.data.bookletName || '');
        if (isBooklet(session.booklet)) pushUnique(this.lists.bookletLabel, session.booklet.metadata.label);
        pushUnique(this.lists.blockId, session.current?.ancestor?.blockId || '');
        pushUnique(this.lists.blockLabel, session.current?.ancestor?.blockId || '');
        pushUnique(this.lists.bookletSpecies, session.booklet.species || '');
      });

    this.lists.mode = Object.keys(TestMode.modes).map(mode => mode.toLowerCase());
  }

  updateFilterId(): void {
    this.filter.id = this.originalId ||
      `${this.filter.target}_${this.filter.not ? 'not_' : ''}${this.filter.type}_${this.filter.value}`;
    this.filter.label = [
      this.cts.getCustomText(`gm_filter_target_${this.filter.target}`) || this.filter.target,
      this.filter.not ? (this.cts.getCustomText(`gm_filter_not_${this.filter.not}`) ?? 'not') : '',
      this.cts.getCustomText(`gm_filter_type_${this.filter.type}`) || this.filter.type,
      this.filter.value.length > 15 ? `${this.filter.value.slice(0, 14)}...` : this.filter.value
    ]
      .filter(a => !!a)
      .join(' ');
  }
}
