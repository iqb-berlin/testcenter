import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { NavControlContext } from '../../interfaces/test-controller.interfaces';

@Component({
  selector: 'tc-navigation-control',
  standalone: true,
  imports: [
    MatIconButton,
    MatTooltip
  ],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent {
  @Input() navContext!: NavControlContext;
  @Output() back: EventEmitter<void> = new EventEmitter<void>();
  @Output() forward: EventEmitter<void> = new EventEmitter<void>();
}
