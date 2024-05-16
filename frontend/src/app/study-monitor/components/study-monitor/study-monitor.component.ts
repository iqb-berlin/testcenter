import { Component, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { ResultData } from '../../../workspace-admin/workspace.interfaces';
import { MainDataService } from '../../../shared/services/maindata/maindata.service';
import { BackendService } from '../../services/backend.service';

@Component({
  templateUrl: './study-monitor.component.html',
  styleUrls: ['./study-monitor.component.css']
})
export class StudyMonitorComponent {
  displayedColumns: string[] = [
    'groupName', 'bookletsStarted', 'numUnitsMin', 'numUnitsMax', 'numUnitsAvg', 'lastChange'
  ];

  resultDataSource: MatTableDataSource<ResultData> | null = new MatTableDataSource<ResultData>([]);

  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  private wsIdSubscription: Subscription | null = null;
  private intervalId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private backendService: BackendService,
    public mainDataService: MainDataService
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.wsIdSubscription = this.route.params.subscribe(params => {
        this.updateTable(params.ws);

        this.intervalId = setInterval(() => {
          this.updateTable(params.ws);
        }, 10000);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.wsIdSubscription) {
      this.wsIdSubscription.unsubscribe();
      this.wsIdSubscription = null;

      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }

  updateTable(wsId: number): void {
    this.resultDataSource = null;
    this.backendService.getResults(wsId)
      .subscribe((resultData: ResultData[]) => {
        this.resultDataSource = new MatTableDataSource<ResultData>(resultData);
        this.resultDataSource.sort = this.sort;
      });
  }
}
