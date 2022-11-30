import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FlexModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
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
    FlexModule,
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
