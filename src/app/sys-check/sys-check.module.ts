import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SysCheckRoutingModule } from './sys-check-routing.module';
import { StartComponent } from './start.component';
import { RunComponent } from './run.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule, MatCheckboxModule, MatMenuModule, MatTooltipModule, MatCardModule, MatStepperModule,
  MatToolbarModule, MatIconModule, MatDialogModule, MatFormFieldModule, MatInputModule,
  MatTabsModule, MatProgressSpinnerModule } from '@angular/material';
import { EnvironmentCheckComponent } from './environment-check/environment-check.component';
import { NetworkCheckComponent } from './network-check/network-check.component';
import { UnitCheckComponent } from './unit-check/unit-check.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ReportComponent } from './report/report.component';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    FlexLayoutModule,
    SysCheckRoutingModule,
    MatProgressSpinnerModule,
    MatStepperModule
  ],
  declarations: [
    StartComponent,
    RunComponent,
    EnvironmentCheckComponent,
    NetworkCheckComponent,
    UnitCheckComponent,
    QuestionnaireComponent,
    ReportComponent],
  exports: [
    StartComponent
  ]
})
export class SysCheckModule { }
