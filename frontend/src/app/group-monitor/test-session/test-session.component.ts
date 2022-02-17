import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {
  Testlet, Unit, TestViewDisplayOptions,
  isUnit, Selected, TestSession, TestSessionSuperState
} from '../group-monitor.interfaces';
import { TestSessionUtil } from './test-session.util';
import { superStates } from './super-states';

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
  @Input() testSession: TestSession;
  @Input() displayOptions: TestViewDisplayOptions;
  @Input() marked: Selected;
  @Input() selected: Selected;
  @Input() checked: boolean;

  @Output() markedElement$ = new EventEmitter<Selected>();
  @Output() selectedElement$ = new EventEmitter<Selected>();
  @Output() checked$ = new EventEmitter<boolean>();

  superStateIcons: { [key in TestSessionSuperState]: IconData } = superStates;

  stateString = TestSessionUtil.stateString;

  hasState = TestSessionUtil.hasState;

  getTestletType = (testletOrUnit: Unit|Testlet): 'testlet'|'unit' => (isUnit(testletOrUnit) ? 'unit' : 'testlet');

  trackUnits = (index: number, testlet: Testlet|Unit): string => testlet.id || index.toString();

  mark(testletOrNull: Testlet|null = null): void {
    if ((testletOrNull != null) && !testletOrNull.blockId) {
      return;
    }
    this.marked = this.asSelectionObject(testletOrNull);
    this.markedElement$.emit(this.marked);
  }

  isSelected(testletOrNull: Testlet|null = null): boolean {
    return testletOrNull &&
      (this.selected?.element?.blockId === testletOrNull.blockId) &&
      (this.selected?.originSession.booklet.species === this.testSession.booklet.species);
  }

  isSelectedHere(testletOrNull: Testlet|null = null): boolean {
    return this.isSelected(testletOrNull) && (this.selected.originSession.data.testId === this.testSession.data.testId);
  }

  isMarked(testletOrNull: Testlet|null = null): boolean {
    return testletOrNull &&
      (this.marked?.element?.blockId === testletOrNull.blockId) &&
      (this.marked?.originSession.booklet.species === this.testSession.booklet.species);
  }

  select($event: Event, testletOrNull: Testlet|null): void {
    if ((testletOrNull != null) && !testletOrNull.blockId) {
      return;
    }
    $event.stopPropagation();
    this.applySelection(testletOrNull);
  }

  deselect($event: MouseEvent|null): void {
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

  private applySelection(testletOrNull: Testlet|null = null, inversion = false): void {
    this.selected = this.asSelectionObject(testletOrNull, inversion);
    this.selectedElement$.emit(this.selected);
  }

  private asSelectionObject(testletOrNull: Testlet|null = null, inversion = false): Selected {
    return {
      element: testletOrNull,
      originSession: this.testSession,
      spreading: this.isSelectedHere(testletOrNull) ? !(this.selected?.spreading) : !testletOrNull,
      inversion
    };
  }
}
