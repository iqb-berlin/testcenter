import { Component, Input } from '@angular/core';
import { TestControllerService } from '../../services/test-controller.service';
import {
  Booklet, Testlet, isTestlet, UnitNavigationTarget, NavigationDirectionValue
} from '../../interfaces/test-controller.interfaces';

@Component({
  selector: 'tc-unit-nav-bar',
  templateUrl: './unit-nav-bar.component.html',
  styleUrls: ['./unit-nav-bar.component.css']
})
export class UnitNavBarComponent {
  @Input() booklet: Booklet | null = null;
  @Input() prevButtonVisible: boolean = false;
  @Input() nextButtonVisible: boolean = false;
  @Input() prevButtonEnabled: boolean = false;
  @Input() nextButtonEnabled: boolean = false;
  @Input() forwardAllowed: NavigationDirectionValue = 'yes';
  @Input() backwardAllowed: NavigationDirectionValue = 'yes';
  @Input() retardedDesign: boolean = false;
  testletContext?: { testlet: Testlet, level: number };

  constructor(
    public tcs: TestControllerService
  ) { }

  protected readonly isTestlet = isTestlet;
  protected readonly unitNavigationTarget = UnitNavigationTarget;
}
