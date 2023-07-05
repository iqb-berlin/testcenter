import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { FormsModule } from '@angular/forms';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatExpansionModule } from '@angular/material/expansion';
import { HttpClientModule } from '@angular/common/http';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
import { BytesPipe } from './pipes/bytes/bytes.pipe';
import { CustomtextPipe } from './pipes/customtext/customtext.pipe';
import { AlertComponent } from './components/alert/alert.component';
import { ErrorComponent } from './components/error/error.component';
import { BackendService } from './services/backend.service';

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
    MatTooltipModule
  ],
  declarations: [
    ConfirmDialogComponent,
    MessageDialogComponent,
    BytesPipe,
    CustomtextPipe,
    AlertComponent,
    ErrorComponent
  ],
  exports: [
    ConfirmDialogComponent,
    MessageDialogComponent,
    BytesPipe,
    CustomtextPipe,
    AlertComponent,
    ErrorComponent
  ],
  providers: [
    BackendService
  ]
})
export class SharedModule {}
export { CustomtextService } from './services/customtext/customtext.service';
export { WebsocketBackendService } from './services/websocket-backend/websocket-backend.service';
export { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
export { MessageDialogData, MessageType } from './interfaces/message-dialog.interfaces';
export { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
export { ConfirmDialogData } from './interfaces/confirm-dialog.interfaces';
export { AlertComponent } from './components/alert/alert.component';
export { CustomtextPipe } from './pipes/customtext/customtext.pipe';
export { ConnectionStatus } from './interfaces/websocket-backend.interfaces';
export { MainDataService } from './services/maindata/maindata.service';
export { BugReportService } from './services/bug-report.service';
export { SysConfig, AppSettings } from './interfaces/app-config.interfaces';
export { BookletConfig } from './classes/booklet-config.class';
export { TestMode } from './classes/test-mode.class';
