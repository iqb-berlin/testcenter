import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {
  Testlet, TestViewDisplayOptions, Selected, TestSession, TestSessionSuperState, isBooklet, isTestlet
} from '../group-monitor.interfaces';
import { TestSessionUtil } from './test-session.util';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { superStates } from './super-states';
import { UnitDef } from '../../shared/interfaces/booklet.interfaces';

interface IconData {
  icon: string,
  tooltip: string,
  class?: string,
  description?: string
}

interface TestletContext {
  $implicit: Testlet,
  recursionLevel: number
}

@Component({
    selector: 'tc-test-session',
    templateUrl: './test-session.component.html',
    styleUrls: ['./test-session.component.css'],
    standalone: false
})
export class TestSessionComponent {
  @Input() testSession: TestSession = {} as TestSession;
  @Input() displayOptions: TestViewDisplayOptions = {} as TestViewDisplayOptions;
  @Input() marked: Selected | null = null;
  @Input() selected: Selected | null = null;
  @Input() checked: boolean = false;
  @Input() bookletStates: { [p: string]: string } = {};

  @Output() markedElement$ = new EventEmitter<Selected>();
  @Output() selectedElement$ = new EventEmitter<Selected>();
  @Output() checked$ = new EventEmitter<boolean>();

  superStateIcons: { [key in TestSessionSuperState]: IconData } = superStates;

  // TODO use pipes for the following functions
  stateString = TestSessionUtil.stateString;
  hasState = TestSessionUtil.hasState;
  isBooklet = isBooklet;
  isTestlet = isTestlet;
  // eslint-disable-next-line class-methods-use-this
  trackUnits = (index: number, testlet: Testlet | UnitDef): string => testlet.id || index.toString();

  testletContext?: TestletContext;

  mark(testletOrNull: Testlet | null = null): void {
    if ((testletOrNull != null) && !testletOrNull.blockId) {
      return;
    }
    if (['pending', 'locked'].includes(this.testSession.state)) {
      return;
    }
    this.marked = this.returnAsSelected(testletOrNull);
    this.markedElement$.emit(this.marked);
  }

  isSelectionTheSameBlockAsParentSelection(testletOrNull: Testlet | null = null): boolean {
    return !!testletOrNull && //  is something Nowselected?
      (this.selected?.element?.blockId === testletOrNull?.blockId) && // is nowselected already in parentselection?
      (this.selected?.originSession.booklet.species === this.testSession.booklet.species); // is nowselected same species as parentselection (is it the same block 1? == same col)
  }

  returnClicks(testletOrNull: Testlet | null = null): 'first' | 'second' | 'third' {
    const isSelectionInSameSession = this.isSelectionTheSameBlockAsParentSelection(testletOrNull) &&
      (this.selected?.originSession.data.testId === this.testSession.data.testId); // is the nowSelection the same Session (row in Table)

    if (isSelectionInSameSession && this.selected?.nthClick === 'first') {
      return 'second';
    }
    if (isSelectionInSameSession && this.selected?.nthClick === 'second') {
      return 'third';
    }
    return 'first';
  }

  isMarked(testletOrNull: Testlet | null = null): boolean {
    return !!testletOrNull &&
      (!['pending', 'locked'].includes(this.testSession.state)) &&
      (this.marked?.element?.blockId === testletOrNull.blockId) &&
      (this.marked?.originSession.booklet.species === this.testSession.booklet.species);
  }

  select($event: Event, testletOrNull: Testlet | null): void {
    if ((testletOrNull != null) && !testletOrNull.blockId) {
      return;
    }
    this.applySelection(testletOrNull);
  }

  deselect($event: MouseEvent | null): void {
    if ($event && ($event.currentTarget === $event.target)) {
      this.applySelection();
    }
  }

  deselectForce($event: Event): boolean {
    this.applySelection();
    $event.stopImmediatePropagation();
    $event.stopPropagation();
    $event.preventDefault();
    return false;
  }

  invertSelection(): boolean {
    this.applySelection(this.selected?.element, true);
    return false;
  }

  toggleCheckbox($event: MatCheckboxChange): void {
    this.checked$.emit($event.checked);
  }

  private applySelection(testletOrNull: Testlet | null = null, inversion = false): void {
    if (['pending', 'locked'].includes(this.testSession.state)) {
      return;
    }
    this.selected = this.returnAsSelected(testletOrNull, inversion);
    this.selectedElement$.emit(this.selected);
  }

  private returnAsSelected(testletOrNull: Testlet | null = null, inversion = false): Selected {
    return {
      element: testletOrNull,
      originSession: this.testSession,
      nthClick: this.returnClicks(testletOrNull),
      inversion
    };
  }
}
