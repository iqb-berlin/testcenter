import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
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
import { DebugPaneComponent } from './components/debug-pane/debug-pane.component';
import { PogressBarModePipe } from './pipes/progress-bar-mode.pipe';

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
    UnitMenuComponent,
    DebugPaneComponent,
    PogressBarModePipe
  ],
  providers: [
    UnitActivateGuard,
    UnitDeactivateGuard,
    TestControllerErrorPausedActivateGuard,
    TestControllerDeactivateGuard,
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic'
      }
    }
  ],
  exports: [
    TestControllerComponent
  ]
})
export class TestControllerModule {}
