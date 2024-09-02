import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { CdkTableModule } from '@angular/cdk/table';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from '../shared/shared.module';
import { GroupMonitorRoutingModule } from './group-monitor-routing.module';
import { GroupMonitorComponent } from './group-monitor.component';
import { BackendService } from './backend.service';
import { BookletService } from './booklet/booklet.service';
import { TestSessionComponent } from './test-session/test-session.component';
import { TestSessionManager } from './test-session-manager/test-session-manager.service';
import { GROUP_MONITOR_CONFIG } from './group-monitor.config';
import { GroupMonitorConfig } from './group-monitor.interfaces';
import { AddFilterDialogComponent } from './components/add-filter-dialog/add-filter-dialog.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@NgModule({
  declarations: [
    GroupMonitorComponent,
    TestSessionComponent,
    AddFilterDialogComponent
  ],
  imports: [
    CommonModule,
    GroupMonitorRoutingModule,
    MatTableModule,
    MatTooltipModule,
    CdkTableModule,
    MatChipsModule,
    MatIconModule,
    MatBadgeModule,
    MatSortModule,
    MatMenuModule,
    MatButtonModule,
    MatRadioModule,
    FormsModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    SharedModule,
    MatDialogModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatAutocompleteModule
  ],
  providers: [
    BackendService,
    BookletService,
    TestSessionManager,
    {
      provide: GROUP_MONITOR_CONFIG,
      useValue: <GroupMonitorConfig>{
        checkForIdleInterval: 1000 * 60 * 3
      }
    }
  ]
})
export class GroupMonitorModule {
}
