import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatExpansionModule } from '@angular/material/expansion';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { WorkspacesComponent } from './workspaces/workspaces.component';
import { UsersComponent } from './users/users.component';
import { SuperadminComponent } from './superadmin.component';
import { SuperadminRoutingModule } from './superadmin-routing.module';
import { BackendService } from './backend.service';
import { NewPasswordComponent } from './users/newpassword/new-password.component';
import { NewUserComponent } from './users/newuser/new-user.component';
import { NewworkspaceComponent } from './workspaces/newworkspace/newworkspace.component';
import { EditworkspaceComponent } from './workspaces/editworkspace/editworkspace.component';
import {
  SuperadminPasswordRequestComponent
} from './superadmin-password-request/superadmin-password-request.component';
import { SettingsComponent } from './settings/settings.component';
import { AppConfigComponent } from './settings/app-config.component';
import { EditCustomTextsComponent } from './settings/edit-custom-texts.component';
import { EditCustomTextComponent } from './settings/edit-custom-text.component';
import { SharedModule } from '../shared/shared.module';
import {
  MatLegacyProgressBarModule as MatProgressBarModule
} from '@angular/material/legacy-progress-bar';

@NgModule({
  declarations: [
    SuperadminComponent,
    UsersComponent,
    NewPasswordComponent,
    NewUserComponent,
    NewworkspaceComponent,
    EditworkspaceComponent,
    WorkspacesComponent,
    SettingsComponent,
    SuperadminPasswordRequestComponent,
    AppConfigComponent,
    EditCustomTextsComponent,
    EditCustomTextComponent
  ],
  imports: [
    CommonModule,
    SuperadminRoutingModule,
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
    MatDialogModule,
    MatSnackBarModule,
    MatGridListModule,
    MatCardModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatDividerModule,
    SharedModule,
    MatProgressBarModule
  ],
  exports: [
    SuperadminComponent
  ],
  providers: [
    BackendService,
    [
      { provide: MAT_DATE_LOCALE, useValue: 'de-DE' }
    ]
  ]
})
export class SuperadminModule { }
