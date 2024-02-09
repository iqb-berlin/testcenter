import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {
  Testlet as Testlet, TestViewDisplayOptions,
  isUnit, Selected, TestSession, TestSessionSuperState, isBooklet, BookletError
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

@Component({
  selector: 'tc-test-session',
  templateUrl: './test-session.component.html',
  styleUrls: ['./test-session.component.css']
})
export class TestSessionComponent {
  @Input() testSession: TestSession = {} as TestSession;
  @Input() displayOptions: TestViewDisplayOptions = {} as TestViewDisplayOptions;
  @Input() marked: Selected | null = null;
  @Input() selected: Selected | null = null;
  @Input() checked: boolean = false;

  @Output() markedElement$ = new EventEmitter<Selected>();
  @Output() selectedElement$ = new EventEmitter<Selected>();
  @Output() checked$ = new EventEmitter<boolean>();

  superStateIcons: { [key in TestSessionSuperState]: IconData } = superStates;

  stateString = TestSessionUtil.stateString;

  hasState = TestSessionUtil.hasState;

  // eslint-disable-next-line class-methods-use-this
  getTestletType = (testletOrUnit: UnitDef | Testlet): 'testlet' | 'unit' => (isUnit(testletOrUnit) ? 'unit' : 'testlet');
  isBooklet = isBooklet;
  // eslint-disable-next-line class-methods-use-this
  trackUnits = (index: number, testlet: Testlet | UnitDef): string => testlet.id || index.toString();
  testletContext?: { $implicit: Testlet };

  mark(testletOrNull: Testlet | null = null): void {
    if ((testletOrNull != null) && !testletOrNull.blockId) {
      return;
    }
    if (['pending', 'locked'].includes(this.testSession.state)) {
      return;
    }
    this.marked = this.asSelectionObject(testletOrNull);
    this.markedElement$.emit(this.marked);
  }

  isSelected(testletOrNull: Testlet | null = null): boolean {
    return !!testletOrNull &&
      (this.selected?.element?.blockId === testletOrNull?.blockId) &&
      (this.selected?.originSession.booklet.species === this.testSession.booklet.species);
  }

  isSelectedHere(testletOrNull: Testlet | null = null): boolean {
    return this.isSelected(testletOrNull) &&
      (this.selected?.originSession.data.testId === this.testSession.data.testId);
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
    $event.stopPropagation();
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

  check($event: MatCheckboxChange): void {
    this.checked$.emit($event.checked);
  }

  private applySelection(testletOrNull: Testlet | null = null, inversion = false): void {
    if (['pending', 'locked'].includes(this.testSession.state)) {
      return;
    }
    this.selected = this.asSelectionObject(testletOrNull, inversion);
    this.selectedElement$.emit(this.selected);
  }

  private asSelectionObject(testletOrNull: Testlet | null = null, inversion = false): Selected {
    return {
      element: testletOrNull,
      originSession: this.testSession,
      spreading: this.isSelectedHere(testletOrNull) ? !(this.selected?.spreading) : !testletOrNull,
      inversion
    };
  }
}
