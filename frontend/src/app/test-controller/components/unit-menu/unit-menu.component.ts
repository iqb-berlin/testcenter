import {
  Component, EventEmitter, Output
} from '@angular/core';
import { TestControllerService } from '../../services/test-controller.service';
import { Testlet, isTestlet } from '../../interfaces/test-controller.interfaces';

@Component({
    selector: 'tc-unit-menu',
    templateUrl: './unit-menu.component.html',
    styleUrls: ['./unit-menu.component.css'],
    standalone: false
})
export class UnitMenuComponent {
  @Output() close = new EventEmitter<void>();

  testletContext?: { testlet: Testlet, level: number };

  constructor(public tcs: TestControllerService) { }

  protected readonly isTestlet = isTestlet;

  goto(target: string): void {
    this.close.emit();
    this.tcs.setUnitNavigationRequest(target);
  }
}
