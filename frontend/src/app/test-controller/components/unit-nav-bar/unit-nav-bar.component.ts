import { Component, Input } from '@angular/core';
import { TestControllerService } from '../../services/test-controller.service';
import {
  Booklet, Testlet, isTestlet, UnitNavigationTarget, NavigationDirectionValue
} from '../../interfaces/test-controller.interfaces';
import { NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { MatButton, MatFabButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { UnitInaccessiblePipe } from '@app/test-controller/pipes/unit-inaccessible.pipe';
import { TemplateContextDirective } from '@shared/directives/template-context.directive';

@Component({
  selector: 'tc-unit-nav-bar',
  templateUrl: './unit-nav-bar.component.html',
  imports: [
    NgIf,
    MatFabButton,
    MatTooltip,
    MatButton,
    NgTemplateOutlet,
    UnitInaccessiblePipe,
    TemplateContextDirective,
    NgForOf
  ],
  styleUrls: ['./unit-nav-bar.component.css']
})
export class UnitNavBarComponent {
  @Input() booklet: Booklet | null = null;
  @Input() showInnerBox: boolean = false;
  @Input() prevButtonVisible: boolean = false;
  @Input() nextButtonVisible: boolean = false;
  @Input() prevButtonEnabled: boolean = false;
  @Input() nextButtonEnabled: boolean = false;
  @Input() forwardAllowed: NavigationDirectionValue = 'yes';
  @Input() backwardAllowed: NavigationDirectionValue = 'yes';
  @Input() deprecatedDesign: boolean = false;
  testletContext?: { testlet: Testlet, level: number };

  constructor(
    public tcs: TestControllerService
  ) { }

  protected readonly isTestlet = isTestlet;
  protected readonly unitNavigationTarget = UnitNavigationTarget;
}
