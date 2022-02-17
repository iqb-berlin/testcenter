import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppConfig } from '../../shared/classes/app.config';
import { MainDataService } from '../../shared/services/maindata/maindata.service';
import { BackendService } from '../backend.service';
import { AppSettings, standardLogo } from '../../shared/interfaces/app-config.interfaces';

@Component({
  selector: 'app-app-config',
  templateUrl: 'app-config.component.html',
  styleUrls: ['app-config.component.css']
})

export class AppConfigComponent implements OnInit, OnDestroy {
  configForm: FormGroup;
  dataChanged = false;
  private configDataChangedSubscription: Subscription = null;
  warningIsExpired = false;
  imageError: string;
  logoImageBase64 = '';
  expiredHours = {
    '': '',
    '01': '01:00 Uhr',
    '02': '02:00 Uhr',
    '03': '03:00 Uhr',
    '04': '04:00 Uhr',
    '05': '05:00 Uhr',
    '06': '06:00 Uhr',
    '07': '07:00 Uhr',
    '08': '08:00 Uhr',
    '09': '09:00 Uhr',
    10: '10:00 Uhr',
    11: '11:00 Uhr',
    12: '12:00 Uhr',
    13: '13:00 Uhr',
    14: '14:00 Uhr',
    15: '15:00 Uhr',
    16: '16:00 Uhr',
    17: '17:00 Uhr',
    18: '18:00 Uhr',
    19: '19:00 Uhr',
    20: '20:00 Uhr',
    21: '21:00 Uhr',
    22: '22:00 Uhr',
    23: '23:00 Uhr'
  };

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private mds: MainDataService,
    private bs: BackendService
  ) {
    this.configForm = this.fb.group({
      appTitle: this.fb.control(''),
      introHtml: this.fb.control(''),
      legalNoticeHtml: this.fb.control(''),
      globalWarningText: this.fb.control(''),
      globalWarningExpiredDay: this.fb.control(''),
      globalWarningExpiredHour: this.fb.control(''),
      backgroundBody: this.fb.control(''),
      backgroundBox: this.fb.control('')
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      const appConfig = this.mds.appConfig.getAppConfig();
      this.configForm.setValue({
        appTitle: appConfig.appTitle,
        introHtml: appConfig.introHtml,
        legalNoticeHtml: appConfig.legalNoticeHtml,
        globalWarningText: appConfig.globalWarningText,
        globalWarningExpiredDay: appConfig.globalWarningExpiredDay,
        globalWarningExpiredHour: appConfig.globalWarningExpiredHour,
        backgroundBody: appConfig.backgroundBody,
        backgroundBox: appConfig.backgroundBox
      }, { emitEvent: false });
      this.warningIsExpired = AppConfig.isWarningExpired(
        appConfig.globalWarningExpiredDay,
        appConfig.globalWarningExpiredHour
      );
      this.logoImageBase64 = appConfig.mainLogo;
      this.configDataChangedSubscription = this.configForm.valueChanges.subscribe(() => {
        this.warningIsExpired = AppConfig.isWarningExpired(
          this.configForm.get('globalWarningExpiredDay').value,
          this.configForm.get('globalWarningExpiredHour').value
        );
        this.dataChanged = true;
      });
    });
  }

  saveData(): void {
    const appConfig: AppSettings = {
      appTitle: this.configForm.get('appTitle').value,
      introHtml: this.configForm.get('introHtml').value,
      legalNoticeHtml: this.configForm.get('legalNoticeHtml').value,
      globalWarningText: this.configForm.get('globalWarningText').value,
      globalWarningExpiredDay: this.configForm.get('globalWarningExpiredDay').value,
      globalWarningExpiredHour: this.configForm.get('globalWarningExpiredHour').value,
      backgroundBody: this.configForm.get('backgroundBody').value,
      backgroundBox: this.configForm.get('backgroundBox').value,
      mainLogo: this.logoImageBase64
    };
    this.bs.setAppConfig(appConfig).subscribe(isOk => {
      if (isOk !== false) {
        this.snackBar.open(
          'Konfigurationsdaten der Anwendung gespeichert', 'Info', { duration: 3000 }
        );
        this.dataChanged = false;
        this.mds.appConfig.setAppConfig(appConfig);
        this.mds.appConfig.applyBackgroundColors();
        this.mds.appTitle$.next(appConfig.appTitle);
        this.mds.globalWarning = this.mds.appConfig.warningMessage;
      } else {
        this.snackBar.open('Konnte Konfigurationsdaten der Anwendung nicht speichern', 'Fehler', { duration: 3000 });
      }
    },
    () => {
      this.snackBar.open('Konnte Konfigurationsdaten der Anwendung nicht speichern', 'Fehler', { duration: 3000 });
    });
  }

  imgFileChange(fileInput: any): void {
    this.imageError = null;
    if (fileInput.target.files && fileInput.target.files[0]) {
      // todo check max values
      const maxSize = 20971520;
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
      const maxHeight = 15200;
      const maxWidth = 25600;

      if (fileInput.target.files[0].size > maxSize) {
        this.imageError = `Datei zu groß ( > ${maxSize / 1000} Mb)`;
        return;
      }

      if (allowedTypes.indexOf(fileInput.target.files[0].type) < 0) {
        const allowedImageTypesTruncated = [];
        allowedTypes.forEach(imgType => {
          allowedImageTypesTruncated.push(imgType.substr(5));
        });
        this.imageError = `Zulässige Datei-Typen: (${allowedImageTypesTruncated.join(', ')})`;
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const image = new Image();
        image.src = e.target.result;
        image.onload = rs => {
          const imgTargetElement = rs.currentTarget as HTMLImageElement;
          const imgHeight = imgTargetElement.height;
          const imgWidth = imgTargetElement.width;
          if (imgHeight > maxHeight && imgWidth > maxWidth) {
            this.imageError = `Unzulässige Größe (maximal erlaubt: ${maxHeight}*${maxWidth}px)`;
            return false;
          }
          this.logoImageBase64 = e.target.result;
          this.dataChanged = true;
          return true;
        };
      };
      reader.readAsDataURL(fileInput.target.files[0]);
    }
  }

  removeLogoImg(): void {
    this.logoImageBase64 = standardLogo;
    this.dataChanged = true;
  }

  ngOnDestroy(): void {
    if (this.configDataChangedSubscription !== null) this.configDataChangedSubscription.unsubscribe();
  }
}
