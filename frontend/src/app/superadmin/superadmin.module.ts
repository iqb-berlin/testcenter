import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { FlexLayoutModule } from '@angular/flex-layout';
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
    MatProgressSpinnerModule,
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
    FlexLayoutModule
  ],
  exports: [
    SuperadminComponent
  ],
  entryComponents: [
    NewPasswordComponent,
    NewUserComponent,
    NewworkspaceComponent,
    EditworkspaceComponent
  ],
  providers: [
    BackendService,
    [
      { provide: MAT_DATE_LOCALE, useValue: 'de-DE' }
    ]
  ]
})
export class SuperadminModule { }
