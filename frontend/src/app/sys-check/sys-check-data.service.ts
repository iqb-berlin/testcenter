import { Injectable } from '@angular/core';
import {
  CheckConfig,
  NetworkCheckStatus,
  ReportEntry,
  SpeedParameters,
  StepDef,
  UnitAndPlayerContainer
} from './sys-check.interfaces';
import { KeyValuePairString } from '../test-controller/interfaces/test-controller.interfaces';

@Injectable({
  providedIn: 'root'
})
export class SysCheckDataService {
  private steps: string[] = [];
  stepLabels: string[] = [];
  private currentStep = 0;
  nextStep = '';
  prevStep = '';
  private stepDefs: StepDef[] = [
    {
      route: 'w',
      label: 'Ermitteln von Systemdaten (Betriebssystem, Browser)'
    },
    {
      route: 'n',
      label: 'Schätzung der Qualität der Internetverbindung'
    },
    {
      route: 'u',
      label: 'Prüfen von typischen Eingabe-Elementen'
    },
    {
      route: 'q',
      label: 'Beantworten einiger Fragen'
    },
    {
      route: 'r',
      label: 'Senden eines Berichtes'
    }
  ];

  checkConfig: CheckConfig = {
    canSave: false,
    customTexts: [],
    downloadSpeed: <SpeedParameters>{},
    hasUnit: false,
    label: '',
    name: '',
    questions: [],
    skipNetwork: true,
    uploadSpeed: <SpeedParameters>{},
    workspaceId: -1
  };

  loadConfigComplete = false;
  unitAndPlayerContainer: UnitAndPlayerContainer | null = null;
  environmentReport: ReportEntry[] = [];
  networkReport: ReportEntry[] = [];
  questionnaireReport: ReportEntry[] = [];
  networkCheckStatus: NetworkCheckStatus = {
    done: true,
    message: 'Messung noch nicht gestartet',
    avgUploadSpeedBytesPerSecond: -1,
    avgDownloadSpeedBytesPerSecond: -1
  };

  timeCheckDone = false;

  dataParts: KeyValuePairString = {};
  unitStateDataType: string = '';

  setSteps(): void {
    this.steps = [];
    this.stepLabels = [];
    this.stepDefs.forEach(step => {
      if (this.checkConfig) {
        if ((step.route === 'w') ||
          (step.route === 'n' && !this.checkConfig.skipNetwork) ||
          (step.route === 'u' && this.checkConfig.hasUnit) ||
          (step.route === 'q' && this.checkConfig.questions.length > 0) ||
          (step.route === 'r' && this.checkConfig.canSave)) {
          this.steps.push(step.route);
          this.stepLabels.push(step.label);
        }
      }
    });
  }

  setNewCurrentStep(newStep: string): void {
    for (let stepIndex = 0; stepIndex < this.steps.length; stepIndex++) {
      if (this.steps[stepIndex] === newStep) {
        this.currentStep = stepIndex;
        this.nextStep = stepIndex < this.steps.length - 1 ? this.steps[this.currentStep + 1] : '';
        this.prevStep = stepIndex > 0 ? this.steps[this.currentStep - 1] : '';
        break;
      }
    }
  }
}
