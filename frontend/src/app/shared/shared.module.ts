import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
import { BytesPipe } from './pipes/bytes/bytes.pipe';
import { CustomtextPipe } from './pipes/customtext/customtext.pipe';
import { AlertComponent } from './components/alert/alert.component';
import { ErrorComponent } from './components/error/error.component';
import { BackendService } from './services/backend.service';
import { PageNavBarComponent } from './components/page-nav-bar/page-nav-bar.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { NewPasswordComponent } from './components/newpassword/new-password.component';
import { TrustPipe } from './pipes/trust.pipe';
import { BlockConditionPipe } from './pipes/block-condition.pipe';
import { TemplateContextDirective } from './directives/template-context.directive';

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatCardModule,
    FormsModule,
    MatInputModule,
    HttpClientModule,
    MatTooltipModule,
    MatButtonToggleModule,
    ReactiveFormsModule
  ],
  declarations: [
    ConfirmDialogComponent,
    MessageDialogComponent,
    BytesPipe,
    CustomtextPipe,
    BlockConditionPipe,
    AlertComponent,
    ErrorComponent,
    TemplateContextDirective,
    PageNavBarComponent,
    TrustPipe,
    PageNavBarComponent,
    AutofocusDirective,
    NewPasswordComponent
  ],
  exports: [
    ConfirmDialogComponent,
    MessageDialogComponent,
    BytesPipe,
    CustomtextPipe,
    BlockConditionPipe,
    AlertComponent,
    ErrorComponent,
    TemplateContextDirective,
    PageNavBarComponent,
    TrustPipe,
    PageNavBarComponent,
    AutofocusDirective,
    NewPasswordComponent
  ],
  providers: [
    BackendService
  ]
})
export class SharedModule {}
export { BackendService } from './services/backend.service';
export { CustomtextService } from './services/customtext/customtext.service';
export { WebsocketBackendService } from './services/websocket-backend/websocket-backend.service';
export { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
export { MessageDialogData } from './interfaces/message-dialog.interfaces';
export { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
export { ConfirmDialogData } from './interfaces/confirm-dialog.interfaces';
export { AlertComponent } from './components/alert/alert.component';
export { CustomtextPipe } from './pipes/customtext/customtext.pipe';
export { ConnectionStatus } from './interfaces/websocket-backend.interfaces';
export { MainDataService } from './services/maindata/maindata.service';
export { PasswordChangeService } from './services/password-change/password-change.service';
export { BugReportService } from './services/bug-report.service';
export { UserAgentService } from './services/user-agent/user-agent.service';
export { SysConfig, AppSettings } from './interfaces/app-config.interfaces';
export { BookletConfig } from './classes/booklet-config.class';
export { TestMode } from './classes/test-mode.class';
export { customTextDefaults } from './objects/customTextDefaults';
export * from './interfaces/booklet.interfaces';
export { ComponentUtilService } from './services/component-util.service';
