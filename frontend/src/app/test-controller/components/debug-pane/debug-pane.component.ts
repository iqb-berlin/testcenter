import {
  ChangeDetectorRef, Component, Inject, OnInit
} from '@angular/core';
import { TestControllerService } from '../../services/test-controller.service';
import { CommandService } from '../../services/command.service';
import { CustomtextService } from '../../../shared/services/customtext/customtext.service';

@Component({
  templateUrl: './debug-pane.component.html',
  styleUrls: ['./debug-pane.component.css'],
  selector: 'tc-debug-pane'
})
export class DebugPaneComponent implements OnInit {
  constructor(
    // public mainDataService: MainDataService,
    public tcs: TestControllerService,
    // private router: Router,
    // private route: ActivatedRoute,
    private cts: CustomtextService,
    public cmd: CommandService,
    // private tls: TestLoaderService,
    private cdr: ChangeDetectorRef,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean
  ) {
    this.bookletConfig = Object.entries(this.tcs.bookletConfig);
    this.testMode = Object.entries(this.tcs.testMode);
  }

  tabs = ['main', 'config', 'testmode', 'units', 'customtexts', 'variables'];

  activeTab : typeof this.tabs[number][] = ['units', 'variables'];

  timerValue = { timeLeftString: 'TODO', testletId: 'd', type: 'd' };

  bookletConfig: Array<[string, string]>;
  testMode: Array<[string, string]>;
  openPanes: Array<string> = [];
  searchCustomText: string = '';

  ngOnInit() {
    this.tcs.testStructureChanges$.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  toggleTab(tab: typeof this.tabs[number]): void {
    if (this.activeTab.includes(tab)) {
      this.activeTab.splice(this.activeTab.indexOf(tab), 1);
    } else {
      this.activeTab.push(tab);
    }
  }

  res(): void {
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
}
