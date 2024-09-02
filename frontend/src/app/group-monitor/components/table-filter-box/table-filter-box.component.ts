import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'tc-table-filter-box',
  templateUrl: './table-filter-box.component.html',
  styleUrls: [
    'table-filter-box.component.css'
  ]
})
export class TableFilterBoxComponent {
  @Input() value!: number | string;
  @Output() valueChange = new EventEmitter<number>();

  isToggled: boolean = true;

  toggle(): void {
    this.isToggled = !this.isToggled;
  }
}
