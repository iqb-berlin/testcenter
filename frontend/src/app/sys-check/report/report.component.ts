import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BackendService } from '../backend.service';
import { SysCheckDataService } from '../sys-check-data.service';
import { SaveReportComponent } from './save-report/save-report.component';
import { ReportEntry } from '../sys-check.interfaces';

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
    private saveDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  saveReport(): void {
    const dialogRef = this.saveDialog.open(SaveReportComponent, {
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
            this.snackBar.open('Bericht gespeichert.', '', { duration: 3000 });
            this.isReportSaved = true;
          });
        }
      }
    });
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
