import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatSortModule } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { SharedModule } from '../shared/shared.module';
import { AttachmentManagerRoutingModule } from './routing/attachment-manager-routing.module';
import { AttachmentManagerComponent } from './components/attachment-manager/attachment-manager.component';
import { CaptureImageComponent } from './components/capture-image/capture-image.component';
import { BackendService } from './services/backend/backend.service';
import { AttachmentOverviewComponent } from './components/attachment-overview/attachment-overview.component';
import { AddAttachmentComponent } from './components/add-attachment/add-attachment.component';
import { AttachmentTitlePipe } from './pipes/attachment-title.pipe';

@NgModule({
  declarations: [
    AttachmentManagerComponent,
    CaptureImageComponent,
    AttachmentOverviewComponent,
    AddAttachmentComponent,
    AttachmentTitlePipe
  ],
  imports: [
    CommonModule,
    AttachmentManagerRoutingModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTableModule,
    MatCheckboxModule,
    MatCardModule,
    MatSlideToggleModule,
    SharedModule,
    MatSortModule,
    FormsModule,
    MatRadioModule
  ],
  providers: [
    BackendService
  ]
})
export class AttachmentManagerModule {
}
