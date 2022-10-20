import {
  Component, Input, OnDestroy, OnInit
} from '@angular/core';
import { Router, RouterState } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppError } from '../../../app.interfaces';
import { MainDataService } from '../../services/maindata/maindata.service';

@Component({
  selector: 'error',
  templateUrl: 'error.component.html',
  styleUrls: ['error.component.css']
})
export class ErrorComponent implements OnInit, OnDestroy {
  @Input() onBeforeClose: () => void;
  @Input() onClose: () => void;
  @Input() closeCaption: string;
  error: AppError;
  errorDetailsOpen = false;
  defaultCloseCaption: string;
  private appErrorSubscription: Subscription;

  constructor(
    private mainDataService: MainDataService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.appErrorSubscription = this.mainDataService.appError$.subscribe(err => {
        this.error = err;
        this.setDefaultCloseCaption();
      });
    });
  }

  private setDefaultCloseCaption() {
    if (this.error.type === 'session') {
      this.defaultCloseCaption = 'Neu Anmelden';
      return;
    }
    this.defaultCloseCaption = undefined;
  }

  ngOnDestroy(): void {
    this.appErrorSubscription.unsubscribe();
  }

  toggleErrorDetails(): void {
    this.errorDetailsOpen = !this.errorDetailsOpen;
  }

  closeClick() {
    if (this.onBeforeClose) {
      this.onBeforeClose();
    }
    if (this.onClose) {
      this.onClose();
    } else {
      this.defaultOnClose();
    }
  }

  private defaultOnClose(): void {
    if (this.error.type === 'session') {
      this.mainDataService.resetAuthData();
      const state: RouterState = this.router.routerState;
      const { snapshot } = state;
      const snapshotUrl = (snapshot.url === '/r/login/') ? '' : snapshot.url;
      this.router.navigate(['/r/login', snapshotUrl]);
    }
  }
}