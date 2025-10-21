import { Component } from '@angular/core';

@Component({
    template: `
    <div [style.display]="'grid'" [style.grid-template-columns]="'20% 80%'" [style.row-gap.px]="10"
         [style.padding.px]="10">
      <h3 [style.grid-row]="'1 / 2'" [style.grid-column]="'1 / 2'">
        Text-Ersetzungen
      </h3>
      <div [style.grid-row]="'1 / 2'" [style.grid-column]="'2 / 3'">
        <tc-custom-texts></tc-custom-texts>
      </div>
      <h3 [style.grid-row]="'2 / 3'" [style.grid-column]="'1 / 2'">
        Konfiguration der Anwendung
      </h3>
      <div [style.grid-row]="'2 / 3'" [style.grid-column]="'2 / 3'">
        <tc-app-config></tc-app-config>
      </div>
    </div>
  `,
    standalone: false
})
export class SettingsComponent {}
