import { ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { SharedModule } from '../shared/shared.module';
import { BackendService } from './backend.service';
import { WorkspaceDataService } from './workspacedata.service';
import { WorkspaceRoutingModule } from './workspace-routing.module';
import { WorkspaceComponent } from './workspace.component';
import { FilesComponent } from './files/files.component';
import { ResultsComponent } from './results/results.component';
import { SyscheckComponent } from './syscheck/syscheck.component';
import { IqbFilesUploadComponent } from './files/iqb-files-upload/iqb-files-upload.component';
import { IqbFilesUploadQueueComponent } from './files/iqb-files-upload-queue/iqb-files-upload-queue.component';
import {
  IqbFilesUploadInputForDirective
} from './files/iqb-files-upload-input-for/iqb-files-upload-input-for.directive';

@NgModule({
  imports: [
    CommonModule,
    WorkspaceRoutingModule,
    MatTableModule,
    MatTabsModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSortModule,
    MatCardModule,
    MatExpansionModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatGridListModule,
    SharedModule,
    MatCardModule,
    MatProgressBarModule
  ],
  exports: [
    WorkspaceComponent
  ],
  declarations: [
    WorkspaceComponent,
    FilesComponent,
    ResultsComponent,
    SyscheckComponent,
    IqbFilesUploadComponent,
    IqbFilesUploadQueueComponent,
    IqbFilesUploadInputForDirective
  ],
  providers: [
    BackendService,
    WorkspaceDataService
  ]
})

export class WorkspaceModule { }
