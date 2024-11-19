import {
  ComponentFixture, TestBed, waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { UnithostComponent } from './unithost.component';
import { ReviewDialogComponent } from '../review-dialog/review-dialog.component';
import { TestControllerService } from '../../services/test-controller.service';
import { BackendService } from '../../services/backend.service';
import { MainDataService, BookletConfig } from '../../../shared/shared.module';
// eslint-disable-next-line import/extensions
import { VeronaNavigationDeniedReason } from '../../interfaces/verona.interfaces';

const bookletConfig = new BookletConfig();
bookletConfig.setFromKeyValuePairs({
  loading_mode: 'LAZY',
  logPolicy: 'rich',
  pagingMode: 'separate',
  page_navibuttons: 'SEPARATE_BOTTOM',
  unit_navibuttons: 'FULL',
  unit_menu: 'OFF',
  force_presentation_complete: 'OFF',
  force_responses_complete: 'OFF',
  unit_screenheader: 'EMPTY',
  unit_title: 'ON',
  unit_show_time_left: 'OFF'
});

const MockTestControllerService = {
  bookletConfig,
  navigationDenial: new Subject<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }>()
};
const MockBackendService = { };
const MockMainDataService = {
  postMessage$: new Subject()
};
const MockActivatedRoute = {
  params: new Subject<Params>()
};

describe('UnithostComponent', () => {
  let component: UnithostComponent;
  let fixture: ComponentFixture<UnithostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        UnithostComponent,
        ReviewDialogComponent
      ],
      imports: [
        CommonModule,
        MatSnackBarModule,
        MatDividerModule
      ],
      providers: [
        { provide: TestControllerService, useValue: MockTestControllerService },
        { provide: BackendService, useValue: MockBackendService },
        { provide: MainDataService, useValue: MockMainDataService },
        { provide: ActivatedRoute, useValue: MockActivatedRoute }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnithostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
