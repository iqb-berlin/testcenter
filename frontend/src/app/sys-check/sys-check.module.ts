import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { RouterModule } from '@angular/router';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { SharedModule } from '../shared/shared.module';
import { TcSpeedChartComponent } from './network-check/tc-speed-chart.component';
import { SaveReportComponent } from './report/save-report/save-report.component';
import { ReportComponent } from './report/report.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { UnitCheckComponent } from './unit-check/unit-check.component';
import { NetworkCheckComponent } from './network-check/network-check.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { SysCheckComponent } from './sys-check.component';
import { SysCheckChildCanActivateGuard, SysCheckRoutingModule } from './sys-check-routing.module';
import { BackendService } from './backend.service';
import { SysCheckDataService } from './sys-check-data.service';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SysCheckRoutingModule,
    SharedModule,
    RouterModule,
    MatButtonToggleModule
  ],
  declarations: [
    SysCheckComponent,
    WelcomeComponent,
    NetworkCheckComponent,
    UnitCheckComponent,
    QuestionnaireComponent,
    ReportComponent,
    SaveReportComponent,
    TcSpeedChartComponent
  ],
  entryComponents: [
    SaveReportComponent
  ],
  providers: [
    BackendService,
    SysCheckDataService,
    SysCheckChildCanActivateGuard
  ]
})
export class SysCheckModule { }
