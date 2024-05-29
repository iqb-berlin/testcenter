import { NgModule } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  CommonModule
} from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StudyMonitorRoutingModule } from './routing/study-monitor-routing.module';
import { StudyMonitorComponent } from './components/study-monitor/study-monitor.component';
import { WorkspaceDataService } from '../workspace-admin';
import { BackendService } from './services/backend.service';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    StudyMonitorRoutingModule,
    MatTabsModule,
    MatTableModule,
    MatProgressBarModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSortModule,
    MatTooltipModule,
    CommonModule,
    SharedModule
  ],
  declarations: [
    StudyMonitorComponent
  ],
  providers: [
    BackendService,
    WorkspaceDataService
  ],
  exports: [
    StudyMonitorComponent
  ]
})
export class StudyMonitorModule {
}
