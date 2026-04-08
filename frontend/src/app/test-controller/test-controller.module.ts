import { NgModule } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { TestControllerComponent } from './components/test-controller/test-controller.component';
import { UnithostComponent } from './components/unithost/unithost.component';
import { TestControllerRoutingModule } from './routing/test-controller-routing.module';
import { UnitMenuComponent } from './components/unit-menu/unit-menu.component';
import { AlertComponent, CustomtextPipe } from '../shared/shared.module';
import { UnitActivateGuard } from './routing/unit-activate.guard';
import { UnitDeactivateGuard } from './routing/unit-deactivate.guard';
import { TestControllerErrorPausedActivateGuard } from './routing/test-controller-error-paused-activate.guard';
import { TestControllerDeactivateGuard } from './routing/test-controller-deactivate.guard';
import { ReviewPanelComponent } from './components/review-panel/review-panel.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { DebugPaneComponent } from '@app/test-controller/components/debug-pane/debug-pane.component';
import { UnitInaccessiblePipe } from '@app/test-controller/pipes/unit-inaccessible.pipe';
import { TemplateContextDirective } from '@shared/directives/template-context.directive';
import { UnitNavBarComponent } from '@app/test-controller/components/unit-nav-bar/unit-nav-bar.component';

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
    DragDropModule,
    MatButtonToggleModule,
    FormsModule,
    MatSidenavModule,
    MatDividerModule,
    MatListModule,
    MatAutocompleteModule,
    MatSelectModule,
    NgIf,
    ReviewPanelComponent,
    NavigationComponent,
    AlertComponent,
    CustomtextPipe,
    DebugPaneComponent,
    UnitInaccessiblePipe,
    TemplateContextDirective,
    UnitNavBarComponent
  ],
  declarations: [
    UnithostComponent,
    TestControllerComponent,
    UnitMenuComponent
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
