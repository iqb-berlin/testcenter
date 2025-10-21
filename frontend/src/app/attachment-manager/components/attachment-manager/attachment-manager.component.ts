import {
  Component, OnDestroy, OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MainDataService } from '../../../shared/services/maindata/maindata.service';

@Component({
    selector: 'tc-attachment-manager',
    templateUrl: './attachment-manager.component.html',
    styleUrls: ['../../../../monitor-layout.css'],
    standalone: false
})
export class AttachmentManagerComponent implements OnInit, OnDestroy {
  groupLabel: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    public mds: MainDataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe(params => {
        this.groupLabel = this.mds.getAccessObject('testGroupMonitor', params['group-name']).label;
      })
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
