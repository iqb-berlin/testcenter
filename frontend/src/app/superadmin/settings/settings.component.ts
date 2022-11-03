import { Component } from '@angular/core';

@Component({
  template: `
    <div fxLayout="column" fxLayoutAlign="start stretch">
      <div fxLayout="row" class="settings-group">
        <div fxFlex="20">
          <mat-label>Text-Ersetzungen</mat-label>
        </div>
        <div fxFlex="78">
          <app-custom-texts></app-custom-texts>
        </div>
      </div>
      <div fxLayout="row" class="settings-group">
        <div fxFlex="20">
          <mat-label>Konfiguration der Anwendung</mat-label>
        </div>
        <div fxFlex="78">
          <app-app-config></app-app-config>
        </div>
      </div>
    </div>
  `,
  styles: ['.settings-group {margin-top: 10px;}']
})
export class SettingsComponent {}
