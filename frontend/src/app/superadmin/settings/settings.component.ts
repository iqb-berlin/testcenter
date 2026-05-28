import { Component, OnInit } from '@angular/core';
import {
  FormBuilder, FormGroup, FormsModule, ReactiveFormsModule
} from '@angular/forms';
import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { firstValueFrom, Subscription } from 'rxjs';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatButton, MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MessageService } from '@shared/services/message.service';
import { Asset, AssetService } from '@shared/services/asset.service';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatTab, MatTabGroup, MatTabLabel } from '@angular/material/tabs';
import {
  MatCard,
  MatCardActions,
  MatCardHeader,
  MatCardImage,
  MatCardTitle
} from '@angular/material/card';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { AppConfig } from '@shared/classes/app.config';
import { AppSettings } from '@shared/interfaces/app-config.interfaces';
import { ThemeService } from '@shared/services/theme.service';
import { BackendService } from '../backend.service';
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
    MatIcon,
    MatRadioGroup,
    MatRadioButton,
    FormsModule,
    EditCustomTextsComponent,
    MatFabButton,
    MatButton,
    MatGridList,
    MatGridTile,
    MatCard,
    MatCardImage,
    MatCardHeader,
    MatCardTitle,
    MatCardActions,
    AsyncPipe,
    MatTabGroup,
    MatTab,
    MatTabLabel
  ],
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private configDataChangedSubscription: Subscription | null = null;
  configForm: FormGroup;
  warningIsExpired = false;
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

  protected availableAssets: Asset[] = [];

  protected ASSET_SLOT_LABELS: Record<string, string> = {
    logo: 'Logo',
    loginIllustration: 'Login-Illustration',
    codeInputIllustration: 'Code-Eingabe-Illustration',
    codeInputCompanion: 'Code-Eingabe-Begleiter',
    starterCompanion: 'Startmenü-Begleiter',
    starterCardDone: 'Startmenü-Karte-Fertig',
    loadingProgress: 'Ladeanimation',
    confirmDialog: 'Bestätigungsdialog'
  };

  constructor(private formBuilder: FormBuilder, private backendService: BackendService,
              public themeService: ThemeService, public assetService: AssetService,
              private messageService: MessageService, private mainDataService: MainDataService) {
    this.configForm = this.formBuilder.group({
      appTitle: this.formBuilder.control(''),
      privacy: this.formBuilder.control(''),
      accessibility: this.formBuilder.control(''),
      legalNoticeHtml: this.formBuilder.control(''),
      globalWarningText: this.formBuilder.control(''),
      globalWarningExpiredDay: this.formBuilder.control(''),
      globalWarningExpiredHour: this.formBuilder.control(''),
      bugReportAuth: this.formBuilder.control(''),
      bugReportTarget: this.formBuilder.control(''),
      themeName: this.formBuilder.control('')
    });
  }

  async ngOnInit(): Promise<void> {
    const appConfig: AppConfig = await firstValueFrom(this.mainDataService.appConfig$);
    this.configForm.setValue({
      appTitle: appConfig.appTitle,
      legalNoticeHtml: appConfig.legalNoticeHtml,
      privacy: appConfig.privacyNotice,
      accessibility: appConfig.accessibilityNotice,
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
    this.configDataChangedSubscription = this.configForm.valueChanges.subscribe(() => {
      this.warningIsExpired = AppConfig.isWarningExpired(
        this.configForm.get('globalWarningExpiredDay')?.value,
        this.configForm.get('globalWarningExpiredHour')?.value
      );
    });
    this.assetService.getAvailableAssets().subscribe(assets => {
      this.availableAssets = assets;
    });
  }

  saveAppConfig(): void {
    const appConfig: AppSettings = {
      appTitle: this.configForm.get('appTitle')?.value,
      legalNoticeHtml: this.configForm.get('legalNoticeHtml')?.value,
      privacyNotice: this.configForm.get('privacy')?.value,
      accessibilityNotice: this.configForm.get('accessibility')?.value,
      globalWarningText: this.configForm.get('globalWarningText')?.value,
      globalWarningExpiredDay: this.configForm.get('globalWarningExpiredDay')?.value,
      globalWarningExpiredHour: this.configForm.get('globalWarningExpiredHour')?.value,
      bugReportTarget: this.configForm.get('bugReportTarget')?.value,
      bugReportAuth: this.configForm.get('bugReportAuth')?.value,
      themeName: this.configForm.get('themeName')?.value
    };
    this.backendService.setAppConfig(appConfig)
      .subscribe(() => {
        this.messageService.showSnackbar('Konfigurationsdaten der Anwendung gespeichert');
        this.configForm.markAsPristine();
        this.configForm.markAsUntouched();
        if (!this.mainDataService.appConfig) {
          return;
        }
        this.mainDataService.appConfig.setAppConfig(appConfig);
        this.mainDataService.appTitle$.next(appConfig.appTitle);
        this.themeService.setTheme(appConfig.themeName);
        this.mainDataService.globalWarning = this.mainDataService.appConfig.getWarningMessage();
      });
  }

  async resetAppConfigForm(): Promise<void> {
    const appConfig: AppConfig = await firstValueFrom(this.mainDataService.appConfig$);
    this.configForm.reset({
      appTitle: appConfig.appTitle,
      legalNoticeHtml: appConfig.legalNoticeHtml,
      privacy: appConfig.privacyNotice,
      accessibility: appConfig.accessibilityNotice,
      globalWarningText: appConfig.globalWarningText,
      globalWarningExpiredDay: appConfig.globalWarningExpiredDay,
      globalWarningExpiredHour: appConfig.globalWarningExpiredHour,
      bugReportAuth: appConfig.bugReportAuth,
      bugReportTarget: appConfig.bugReportTarget,
      themeName: appConfig.themeName
    });
  }

  ngOnDestroy(): void {
    if (this.configDataChangedSubscription !== null) this.configDataChangedSubscription.unsubscribe();
  }
}
