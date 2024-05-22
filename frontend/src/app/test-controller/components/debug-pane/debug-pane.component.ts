import {
  ChangeDetectorRef, Component, Inject, OnInit
} from '@angular/core';
import { ResponseValueType as IQBVariableValueType } from '@iqb/responses/coding-interfaces';
import { TestControllerService } from '../../services/test-controller.service';
import { CommandService } from '../../services/command.service';
import { CustomtextService } from '../../../shared/services/customtext/customtext.service';
import { isTestlet, Testlet, Unit } from '../../interfaces/test-controller.interfaces';
import { MainDataService } from '../../../shared/services/maindata/maindata.service';
import { AuthData } from '../../../app.interfaces';
import { IqbVariableUtil } from '../../util/iqb-variable.util';

@Component({
  templateUrl: './debug-pane.component.html',
  styleUrls: ['./debug-pane.component.css'],
  selector: 'tc-debug-pane'
})
export class DebugPaneComponent implements OnInit {
  constructor(
    public mds: MainDataService,
    public tcs: TestControllerService,
    private cts: CustomtextService,
    public cmd: CommandService,
    private cdr: ChangeDetectorRef,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean
  ) {
  }

  tabs = ['main', 'config', 'testmode', 'booklet', 'unit', 'customtexts', 'variables', 'system'];
  activeTabs : typeof this.tabs[number][] = ['variables'];

  bookletConfig: Array<[string, string]> = [];
  testMode: Array<[string, string]> = [];
  openPanes: Array<string> = [];
  searchCustomText: string = '';
  customTextKeys: Array<string> = [];
  auth: AuthData | null = null;

  unitContext?: { item: Unit; unit: Unit; single: boolean };
  TestletContext?: { item: Testlet };

  private getData(): void {
    this.bookletConfig = Object.entries(this.tcs.bookletConfig);
    this.testMode = Object.entries(this.tcs.testMode);
    this.customTextKeys = this.cts.getCustomTextKeys();
    this.auth = this.mds.getAuthData();
  }

  ngOnInit() {
    this.tcs.testStructureChanges$
      .subscribe(() => {
        this.cdr.detectChanges();
        this.getData();
      });
    const storedState = localStorage.getItem('tc-debug');
    if (storedState) {
      this.activeTabs = JSON.parse(storedState);
    }
  }

  toggleTab(tab: typeof this.tabs[number]): void {
    if (this.activeTabs.includes(tab)) {
      this.activeTabs.splice(this.activeTabs.indexOf(tab), 1);
    } else {
      this.activeTabs.push(tab);
    }
    localStorage.setItem('tc-debug', JSON.stringify(this.activeTabs));
  }

  res(): void {
    // eslint-disable-next-line no-console
    console.log(this.tcs.booklet);
  }

  toggleMore(id: string): void {
    const paneIndex = this.openPanes.indexOf(id);
    if (paneIndex !== -1) {
      this.openPanes.splice(paneIndex, 1);
    } else {
      this.openPanes.push(id);
    }
  }

  protected readonly isTestlet = isTestlet;

  closeWindow(id: string): void {
    const tabId = this.activeTabs.indexOf(id);
    if (tabId !== -1) {
      this.activeTabs.splice(tabId, 1);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  stringValue(value: IQBVariableValueType, shorten: boolean = false) {
    const vStr = IqbVariableUtil.variableValueAsString(value);
    return shorten ? vStr.substring(0, 12) + (vStr.length > 13 ? '...' : '') : vStr;
  }
}
