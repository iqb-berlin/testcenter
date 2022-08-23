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
import { SharedModule } from '../shared/shared.module';
import { AttachmentManagerRoutingModule } from './routing/attachment-manager-routing.module';
import { AttachmentManagerComponent } from './components/attachment-manager/attachment-manager.component';
import { CaptureImageComponent } from './components/capture-image/capture-image.component';
import { BackendService } from './services/backend/backend.service';
import { AttachmentOverviewComponent } from './components/attachment-overview/attachment-overview.component';

@NgModule({
  declarations: [
    AttachmentManagerComponent,
    CaptureImageComponent,
    AttachmentOverviewComponent
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
    MatCheckboxModule,
    MatCardModule,
    MatSlideToggleModule,
    SharedModule
  ],
  providers: [
    BackendService
  ]
})
export class AttachmentManagerModule {
}
