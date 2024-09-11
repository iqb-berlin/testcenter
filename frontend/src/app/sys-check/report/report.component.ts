import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BackendService } from '../backend.service';
import { SysCheckDataService } from '../sys-check-data.service';
import { SaveReportComponent } from './save-report/save-report.component';
import { ReportEntry } from '../sys-check.interfaces';
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
    private mds: MainDataService
  ) {
  }

  saveReport(): void {
    const confirmDialog = () => this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: <ConfirmDialogData>{
        title: 'Bericht gespeichert',
        content: 'Der Bericht wurde erfolgreich gespeichert.',
        confirmbuttonlabel: 'Verstanden'
      }
    });
    if (!this.mds.sysCheckAvailableForAll) {
      this.backendService.saveReport(
        this.dataService.checkConfig.workspaceId,
        this.dataService.checkConfig.name,
        {
          environment: this.dataService.environmentReport,
          network: this.dataService.networkReport,
          questionnaire: this.dataService.questionnaireReport,
          unit: []
        }
      ).subscribe(() => {
        confirmDialog();
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
                environment: this.dataService.environmentReport,
                network: this.dataService.networkReport,
                questionnaire: this.dataService.questionnaireReport,
                unit: []
              }
            ).subscribe(() => {
              confirmDialog();
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
        if (this.dataService.questionnaireReport.length > 0) {
          this.dataService.questionnaireReport.forEach(re => {
            if (re.warning) {
              this.questionnaireDataWarnings.push(re);
            }
          });
        } else {
          this.questionnaireDataWarnings.push({
            id: 'tütü', // TODO fix this WTF
            type: 'yoyo',
            label: 'keine Antworten registriert',
            value: 'naja',
            warning: true
          });
        }
      }
    });
  }
}
