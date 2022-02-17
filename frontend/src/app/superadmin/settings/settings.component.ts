import { Component } from '@angular/core';

@Component({
  template: `
    <div fxLayout="column" fxLayoutAlign="start stretch" class="admin-tab-content">
      <div fxLayout="row" class="div-row">
        <div fxFlex="30">
          <mat-label>Text-Ersetzungen</mat-label>
        </div>
        <div fxFlex="68">
          <app-custom-texts></app-custom-texts>
        </div>
      </div>
      <div fxLayout="row" class="div-row">
        <div fxFlex="30">
          <mat-label>Konfiguration der Anwendung</mat-label>
        </div>
        <div fxFlex="68">
          <app-app-config></app-app-config>
        </div>
      </div>
    </div>
  `,
  styles: ['.div-row {border-color: gray; border-width: 0 0 1px 0; border-style: solid; margin-top: 10px}']
})
export class SettingsComponent {}
