import { Component, Input } from '@angular/core';
import { TestControllerService } from '../../services/test-controller.service';
import { UnitNaviButtonData } from '../../interfaces/test-controller.interfaces';
import { CustomtextService } from '../../../shared/services/customtext/customtext.service';

@Component({
  selector: 'tc-unit-menu',
  templateUrl: './unit-menu.component.html',
  styleUrls: ['./unit-menu.component.css']
})
export class UnitMenuComponent {
  @Input() menu: Array<UnitNaviButtonData> = [];

  constructor(
    public tcs: TestControllerService,
    private cts: CustomtextService
  ) { }

  terminateTest(): void {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE', false, this.tcs.bookletConfig.lock_test_on_termination === 'ON');
    this.cts.restoreDefault(false);
  }
}
