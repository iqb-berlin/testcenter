import {
  Component, computed, EventEmitter, Input, Output, Signal, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MainDataService } from '../../../shared/services/maindata/maindata.service';

@Component({
  selector: 'tc-code-keypad-form',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './fab-form.component.html',
  styleUrl: './fab-form.component.scss'
})
export class FabFormComponent {
  @Input() visualMode: 'text-field' | 'keypad-symbols' | 'keypad-numbers' = 'keypad-symbols';
  @Output() submitCode = new EventEmitter<string | null>();
  @Output() clearInput = new EventEmitter<void>();

  readonly buttonIcons: { [key: number]: string } = {
    1: 'star',
    2: 'favorite',
    3: 'crop_square',
    4: 'bedtime',
    5: 'sentiment_satisfied',
    6: 'cloud',
    7: 'filter_vintage',
    8: 'wb_sunny',
    9: 'change_history'
  };

  selectedValues = signal<(number | null)[]>(Array(5).fill(null));
  activeValueIndex: Signal<number> = computed(() => this.selectedValues().indexOf(null));

  constructor(private mds: MainDataService) {}

  onSelect(selectedValue: string): void {
    this.selectedValues.update(selectedValues => {
      const copy = [...selectedValues];
      copy[this.activeValueIndex()] = parseInt(selectedValue, 10);
      return copy;
    });
    // Auto-submit when 5th value is selected
    if (this.selectedValues().every(icon => icon !== null)) {
      this.submitCode.emit(this.selectedValues().join(''));
    }
  }

  clearSelection(): void {
    this.selectedValues.set(Array(5).fill(null));
    this.clearInput.emit();
  }
}
