import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { RouterModule } from '@angular/router';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AlertComponent, SharedModule } from '../shared/shared.module';
import { TcSpeedChartComponent } from './network-check/tc-speed-chart.component';
import { NetworkCheckComponent } from './network-check/network-check.component';
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
    MatStepperModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SysCheckRoutingModule,
    SharedModule,
    RouterModule,
    MatButtonToggleModule,
    AlertComponent
  ],
  declarations: [
    SysCheckComponent,
    NetworkCheckComponent,
    TcSpeedChartComponent
  ],
  providers: [
    BackendService,
    SysCheckDataService,
    SysCheckChildCanActivateGuard
  ]
})
export class SysCheckModule { }
