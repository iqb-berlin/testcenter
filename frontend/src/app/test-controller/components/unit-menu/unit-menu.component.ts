import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { TestControllerService } from '../../services/test-controller.service';
import { Testlet, isTestlet } from '../../interfaces/test-controller.interfaces';
import { CustomtextService } from '../../../shared/services/customtext/customtext.service';

@Component({
  selector: 'tc-unit-menu',
  templateUrl: './unit-menu.component.html',
  styleUrls: ['./unit-menu.component.css']
})
export class UnitMenuComponent {
  @Input() freeNavigation: boolean = false;
  @Output() close = new EventEmitter<void>();

  testletContext?: { testlet: Testlet, level: number };

  constructor(
    public tcs: TestControllerService,
    private cts: CustomtextService
  ) { }

  protected readonly isTestlet = isTestlet;

  terminateTest(): void {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE', false, this.tcs.bookletConfig.lock_test_on_termination === 'ON');
    this.cts.restoreDefault(false);
  }

  goto(target: string): void {
    console.log('close');
    this.close.emit();
    this.tcs.setUnitNavigationRequest(target);
  }
}
