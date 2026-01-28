import { Component } from '@angular/core';
import {
  FormBuilder, FormGroup, FormsModule, ReactiveFormsModule
} from '@angular/forms';
import { KeyValuePipe } from '@angular/common';
import { firstValueFrom, Subscription } from 'rxjs';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatFabButton, MatMiniFabButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MainDataService } from '../../shared/services/maindata/maindata.service';
import { BackendService } from '../backend.service';
import { AppConfig } from '../../shared/classes/app.config';
import { AppSettings, DEFAULT_LOGO } from '../../shared/interfaces/app-config.interfaces';
import { Theme, THEMES, ThemeService } from '../../shared/services/theme.service';
import { SharedModule } from '../../shared/shared.module';
import { EditCustomTextsComponent } from './edit-custom-texts.component';

@Component({
  imports: [
    KeyValuePipe,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    CdkTextareaAutosize,
    MatDatepickerToggle,
    MatDatepickerInput,
    MatDatepicker,
    MatSelect,
    MatOption,
    MatMiniFabButton,
    MatTooltip,
    MatIcon,
    MatRadioGroup,
    MatRadioButton,
    FormsModule,
    SharedModule,
    EditCustomTextsComponent,
    MatFabButton
  ],
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.css']
})
export class SettingsComponent {
  private configDataChangedSubscription: Subscription | null = null;
  protected readonly THEMES: Theme[] = THEMES;
  configForm: FormGroup;
  warningIsExpired = false;
  imageError: string | null = '';
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

  constructor(private formBuilder: FormBuilder, private backendService: BackendService,
              private themeService: ThemeService,
              private snackBar: MatSnackBar, private mainDataService: MainDataService) {
    this.configForm = this.formBuilder.group({
      appTitle: this.formBuilder.control(''),
      introHtml: this.formBuilder.control(''),
      legalNoticeHtml: this.formBuilder.control(''),
      globalWarningText: this.formBuilder.control(''),
      globalWarningExpiredDay: this.formBuilder.control(''),
      globalWarningExpiredHour: this.formBuilder.control(''),
      bugReportAuth: this.formBuilder.control(''),
      bugReportTarget: this.formBuilder.control(''),
      themeName: this.formBuilder.control('')
    });
  }

  ngOnInit(): void {
    setTimeout(async () => {
      const appConfig: AppConfig = await firstValueFrom(this.mainDataService.appConfig$);
      this.configForm.setValue({
        appTitle: appConfig.appTitle,
        introHtml: appConfig.introHtml,
        legalNoticeHtml: appConfig.legalNoticeHtml,
        globalWarningText: appConfig.globalWarningText,
        globalWarningExpiredDay: appConfig.globalWarningExpiredDay,
        globalWarningExpiredHour: appConfig.globalWarningExpiredHour,
        bugReportAuth: appConfig.bugReportAuth,
        bugReportTarget: appConfig.bugReportTarget,
        themeName: appConfig.themeName
      }, { emitEvent: false });
      this.warningIsExpired = AppConfig.isWarningExpired(
        appConfig.globalWarningExpiredDay,
        appConfig.globalWarningExpiredHour
      );
      this.logoImageBase64 = appConfig.mainLogo;
      this.configDataChangedSubscription = this.configForm.valueChanges.subscribe(() => {
        this.warningIsExpired = AppConfig.isWarningExpired(
          this.configForm.get('globalWarningExpiredDay')?.value,
          this.configForm.get('globalWarningExpiredHour')?.value
        );
      });
    });
  }

  saveData(): void {
    const appConfig: AppSettings = {
      appTitle: this.configForm.get('appTitle')?.value,
      introHtml: this.configForm.get('introHtml')?.value,
      legalNoticeHtml: this.configForm.get('legalNoticeHtml')?.value,
      globalWarningText: this.configForm.get('globalWarningText')?.value,
      globalWarningExpiredDay: this.configForm.get('globalWarningExpiredDay')?.value,
      globalWarningExpiredHour: this.configForm.get('globalWarningExpiredHour')?.value,
      mainLogo: this.logoImageBase64,
      bugReportTarget: this.configForm.get('bugReportTarget')?.value,
      bugReportAuth: this.configForm.get('bugReportAuth')?.value,
      themeName: this.configForm.get('themeName')?.value
    };
    this.backendService.setAppConfig(appConfig)
      .subscribe(() => {
        this.snackBar.open('Konfigurationsdaten der Anwendung gespeichert', 'Info', { duration: 3000 });
        this.configForm.markAsPristine();
        this.configForm.markAsUntouched();
        if (!this.mainDataService.appConfig) {
          return;
        }
        this.mainDataService.appConfig.setAppConfig(appConfig);
        this.mainDataService.appTitle$.next(appConfig.appTitle);
        this.themeService.setTheme(appConfig.themeName);
        this.mainDataService.globalWarning = this.mainDataService.appConfig.warningMessage;
      });
  }

  async resetForm(): Promise<void> {
    const appConfig: AppConfig = await firstValueFrom(this.mainDataService.appConfig$);
    this.configForm.reset({
      appTitle: appConfig.appTitle,
      introHtml: appConfig.introHtml,
      legalNoticeHtml: appConfig.legalNoticeHtml,
      globalWarningText: appConfig.globalWarningText,
      globalWarningExpiredDay: appConfig.globalWarningExpiredDay,
      globalWarningExpiredHour: appConfig.globalWarningExpiredHour,
      bugReportAuth: appConfig.bugReportAuth,
      bugReportTarget: appConfig.bugReportTarget,
      themeName: appConfig.themeName
    });
  }

  imgFileChange(fileInput: Event): void {
    const target = fileInput.target as HTMLInputElement;
    const files = target.files as FileList;
    this.imageError = null;
    if (files && files[0]) {
      // todo check max values
      const maxSize = 20971520;
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
      const maxHeight = 15200;
      const maxWidth = 25600;

      if (files[0].size > maxSize) {
        this.imageError = `Datei zu groß ( > ${maxSize / 1000} Mb)`;
        return;
      }

      if (allowedTypes.indexOf(files[0].type) < 0) {
        const allowedImageTypesTruncated: string[] = [];
        allowedTypes.forEach((imgType: string) => {
          allowedImageTypesTruncated.push(imgType.substr(5));
        });
        this.imageError = `Zulässige Datei-Typen: (${allowedImageTypesTruncated.join(', ')})`;
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        if (!e || !e.target || !e.target.result || (typeof e.target.result !== 'string')) {
          this.imageError = 'Konnte Bild nicht lesen';
          return;
        }
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
          if (!e || !e.target || !e.target.result || (typeof e.target.result !== 'string')) {
            this.imageError = 'Konnte Bild nicht lesen';
            return false;
          }
          this.logoImageBase64 = e.target.result;
          return true;
        };
      };
      reader.readAsDataURL(files[0]);
    }
  }

  removeLogoImg(): void {
    this.logoImageBase64 = DEFAULT_LOGO;
  }

  ngOnDestroy(): void {
    if (this.configDataChangedSubscription !== null) this.configDataChangedSubscription.unsubscribe();
  }
}
