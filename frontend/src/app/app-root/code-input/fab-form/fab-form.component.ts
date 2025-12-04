import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface GridIcon {
  id: string;
  icon: string;
}

@Component({
  selector: 'app-fab-form',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './fab-form.component.html',
  styleUrl: './fab-form.component.css',
})
export class FabFormComponent {

  gridIcons: GridIcon[][] = [
    [
      { id: 'star', icon: 'star' },
      { id: 'heart', icon: 'favorite' },
      { id: 'square', icon: 'crop_square' }
    ],
    [
      { id: 'home', icon: 'home' },
      { id: 'smiley', icon: 'sentiment_satisfied' },
      { id: 'cloud', icon: 'cloud' }
    ],
    [
      { id: 'flower', icon: 'filter_vintage' },
      { id: 'sun', icon: 'wb_sunny' },
      { id: 'triangle', icon: 'change_history' }
    ]
  ];

  selectedIcons = signal<(GridIcon | null)[]>(Array(5).fill(null));
  nextIcon = computed(() => this.selectedIcons().indexOf(null))

  clearSelection() {
    this.selectedIcons.set(Array(5).fill(null));
  }

  onIconSelect(arg: GridIcon) {
    if (this.nextIcon() >= 0) {
      this.selectedIcons.update(icons => {
        const newIcons = [...icons];
        newIcons[this.nextIcon()] = arg;
        return newIcons;
      });
    }
  }
}
