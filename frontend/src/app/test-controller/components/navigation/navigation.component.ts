import {
  Component, EventEmitter, Input, OnChanges, Output
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { NavControlContext } from '../../interfaces/test-controller.interfaces';

@Component({
  selector: 'tc-navigation-control',
  imports: [
    MatIconButton,
    MatTooltip,
    MatIcon
  ],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent implements OnChanges {
  @Input() navContext!: NavControlContext;
  @Output() back: EventEmitter<void> = new EventEmitter<void>();
  @Output() forward: EventEmitter<void> = new EventEmitter<void>();
  @Input() dataCy?: string;

  maxListTabs?: number[];

  ngOnChanges() {
    this.maxListTabs = Array.from({ length: this.navContext.maxIndex }, (_, i) => i + 1);
  }
}
