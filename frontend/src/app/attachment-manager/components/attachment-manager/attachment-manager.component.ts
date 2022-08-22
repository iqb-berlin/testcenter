import {
  Component, OnDestroy, OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { BackendService } from '../../services/backend/backend.service';
import { MainDataService } from '../../../shared/services/maindata/maindata.service';
import { GroupData } from '../../../group-monitor/group-monitor.interfaces';

@Component({
  selector: 'app-attachment-manager',
  templateUrl: './attachment-manager.component.html',
  styleUrls: ['./attachment-manager.component.css']
})
export class AttachmentManagerComponent implements OnInit, OnDestroy {
  ownGroup$: Observable<GroupData>;

  private subscriptions: Subscription[] = [];

  constructor(
    public mds: MainDataService,
    private route: ActivatedRoute,
    private bs: BackendService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe(params => {
        this.ownGroup$ = this.bs.getGroupData(params['group-name']);
      })
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
