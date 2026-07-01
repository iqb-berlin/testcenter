import { Component, OnDestroy, OnInit } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { MainDataService } from '@shared/shared.module';
import { HeaderService } from '@shared/services/header.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: './generic-info-page.component.html',
  styles: `
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: auto;
    }
    .body-text {
      font-size: larger;
    }
  `
})
export class GenericInfoPageComponent implements OnInit, OnDestroy {
  content: SafeUrl | null = null;
  private configSubscription: Subscription | null = null;

  constructor(private route: ActivatedRoute,
              public mds: MainDataService,
              private headerService: HeaderService) { }

  ngOnInit(): void {
    const routeData = this.route.snapshot.data;
    this.mds.appSubTitle$.next(routeData.title);
    this.headerService.title = routeData.title;
    this.configSubscription = this.mds.appConfig$.subscribe((config: unknown) => {
      this.content = (config as { [key: string]: SafeUrl })[routeData.contentKey];
    });
  }

  ngOnDestroy(): void {
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
  }
}
