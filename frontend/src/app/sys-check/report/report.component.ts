import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BackendService } from '../backend.service';
import { SysCheckDataService } from '../sys-check-data.service';
import { SaveReportComponent } from './save-report/save-report.component';
import { ReportEntry, ResponsesForSysCheck } from '../sys-check.interfaces';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogData } from '../../shared/interfaces/confirm-dialog.interfaces';
import { MainDataService } from '../../shared/services/maindata/maindata.service';

@Component({
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css', '../sys-check.component.css']
})
export class ReportComponent implements OnInit {
  isReportSaved = false;
  questionnaireDataWarnings: ReportEntry[] = [];

  constructor(
    private backendService: BackendService,
    public dataService: SysCheckDataService,
    private dialog: MatDialog,
    private mds: MainDataService,
    private router: Router
  ) {
  }

  saveReport(): void {
    const confirmDialogRef = () => this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: <ConfirmDialogData>{
        title: 'Bericht gespeichert',
        content: 'Der Bericht wurde erfolgreich gespeichert. Sie werden nach der Bestätigung weitergeleitet.',
        confirmbuttonlabel: 'Verstanden'
      }
    }).afterClosed().subscribe(() => {
      setTimeout(() => {
        this.router.navigate(['/r']);
      }, 500);
    });

    const responses: ResponsesForSysCheck[] = Object.keys(this.dataService.dataParts).map(key => ({
      id: key,
      content: this.dataService.dataParts[key],
      ts: Date.now(),
      responseType: this.dataService.unitStateDataType
    }));

    if (!this.mds.sysCheckAvailableForAll) {
      this.backendService.saveReport(
        this.dataService.checkConfig.workspaceId,
        this.dataService.checkConfig.name,
        {
          environment: this.dataService.environmentReports,
          network: this.dataService.networkReports,
          questionnaire: this.dataService.questionnaireReports,
          unit: [],
          responses: responses
        }
      ).subscribe(() => {
        confirmDialogRef();
      });
    } else {
      const dialogRef = this.dialog.open(SaveReportComponent, {
        width: '500px',
        height: '600px'
      });
      dialogRef.afterClosed().subscribe(result => {
        if (typeof result !== 'undefined') {
          if (result !== false) {
            const reportKey = result.get('key').value as string;
            const reportTitle = result.get('title').value as string;
            this.backendService.saveReport(
              this.dataService.checkConfig.workspaceId,
              this.dataService.checkConfig.name,
              {
                keyPhrase: reportKey,
                title: reportTitle,
                environment: this.dataService.environmentReports,
                network: this.dataService.networkReports,
                questionnaire: this.dataService.questionnaireReports,
                unit: [],
                responses: responses
              }
            ).subscribe(() => {
              confirmDialogRef();
            });
          }
        }
      });
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.dataService.setNewCurrentStep('r');
      this.questionnaireDataWarnings = [];
      if (this.dataService.checkConfig && this.dataService.checkConfig.questions.length > 0) {
        this.dataService.questionnaireReports.forEach(re => {
          if (re.warning) {
            this.questionnaireDataWarnings.push(re);
          }
        });
      }
    });
  }
}
