import {
  Component, EventEmitter, Input, OnChanges, Output
} from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { NavControlContext } from '../../interfaces/test-controller.interfaces';

@Component({
  selector: 'tc-navigation-control',
  imports: [
    MatIconButton,
    MatTooltip,
    MatTabGroup,
    MatTab,
    MatIcon
  ],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent implements OnChanges {
  @Input() navContext!: NavControlContext;
  @Output() back: EventEmitter<void> = new EventEmitter<void>();
  @Output() forward: EventEmitter<void> = new EventEmitter<void>();

  maxTabs?: number[];

  ngOnChanges() {
    this.maxTabs = Array.from({ length: this.navContext.maxIndex }, (_, i) => i + 1);
  }
}