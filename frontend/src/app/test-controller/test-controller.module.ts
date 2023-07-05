import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { ReviewDialogComponent } from './components/review-dialog/review-dialog.component';
import { TestControllerComponent } from './components/test-controller/test-controller.component';
import { UnithostComponent } from './components/unithost/unithost.component';
import { TestControllerRoutingModule } from './routing/test-controller-routing.module';
import { TestStatusComponent } from './components/test-status/test-status.component';
import { UnitMenuComponent } from './components/unit-menu/unit-menu.component';
import { SharedModule } from '../shared/shared.module';
import { UnitActivateGuard } from './routing/unit-activate.guard';
import { UnitDeactivateGuard } from './routing/unit-deactivate.guard';
import { TestControllerErrorPausedActivateGuard } from './routing/test-controller-error-paused-activate.guard';
import { TestControllerDeactivateGuard } from './routing/test-controller-deactivate.guard';

export { TestControllerService } from './services/test-controller.service';

@NgModule({
  imports: [
    CommonModule,
    TestControllerRoutingModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatRadioModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDialogModule,
    MatProgressBarModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    SharedModule,
    DragDropModule,
    MatButtonToggleModule,
    FormsModule,
    MatSidenavModule,
    MatDividerModule,
    MatListModule
  ],
  declarations: [
    UnithostComponent,
    TestControllerComponent,
    ReviewDialogComponent,
    TestStatusComponent,
    UnitMenuComponent
  ],
  providers: [
    UnitActivateGuard,
    UnitDeactivateGuard,
    TestControllerErrorPausedActivateGuard,
    TestControllerDeactivateGuard
  ],
  exports: [
    TestControllerComponent
  ]
})
export class TestControllerModule {}
