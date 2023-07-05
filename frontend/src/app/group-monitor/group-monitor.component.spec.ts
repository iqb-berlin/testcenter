/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {
  MatLegacyDialog as MatDialog,
  MatLegacyDialogModule as MatDialogModule
} from '@angular/material/legacy-dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Pipe } from '@angular/core';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AlertComponent, CustomtextPipe } from '../shared/shared.module';
import { GroupMonitorComponent } from './group-monitor.component';
import {
  CheckingOptions, CommandResponse,
  TestSession, TestSessionData, TestSessionSetStats
} from './group-monitor.interfaces';
import { BackendService } from './backend.service';
import { TestSessionComponent } from './test-session/test-session.component';
import { TestSessionManager } from './test-session-manager/test-session-manager.service';
import {
  unitTestSessionsStats,
  unitTestCheckedStats,
  unitTestExampleSessions,
  unitTestCommandResponse
} from './unit-test-example-data.spec';

class MockMatDialog {
  open(): { afterClosed: () => Observable<{ action: boolean }> } {
    return {
      afterClosed: () => of({ action: true })
    };
  }
}

class MockBackendService {
  observeSessionsMonitor(): Observable<TestSessionData[]> {
    return of([unitTestExampleSessions[0].data]);
  }

  cutConnection(): void {}
}

class MockTestSessionManagerService {
  checkingOptions: CheckingOptions = {
    enableAutoCheckAll: false,
    autoCheckAll: true
  };

  sessionsStats$ = new BehaviorSubject<TestSessionSetStats>(unitTestSessionsStats);
  checkedStats$ = new BehaviorSubject<TestSessionSetStats>(unitTestCheckedStats);
  sessions$ = new BehaviorSubject<TestSession[]>(unitTestExampleSessions);
  commandResponses$ = new BehaviorSubject<CommandResponse>(unitTestCommandResponse);
  sessions = unitTestExampleSessions;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connect = (_: string) => {};
  disconnect = () => {};
  isChecked = () => false;
}

@Pipe({ name: 'customtext' })
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MockCustomtextPipe {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(defaultValue: string, ..._: string[]): Observable<string> {
    return of<string>(defaultValue);
  }
}

describe('GroupMonitorComponent', () => {
  let component: GroupMonitorComponent;
  let fixture: ComponentFixture<GroupMonitorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        GroupMonitorComponent,
        TestSessionComponent,
        CustomtextPipe,
        AlertComponent
      ],
      imports: [
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
        RouterTestingModule,
        MatMenuModule,
        MatSidenavModule,
        NoopAnimationsModule,
        MatRadioModule,
        MatCheckboxModule,
        MatTableModule,
        MatSlideToggleModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: TestSessionManager, useValue: new MockTestSessionManagerService() },
        { provide: MatDialog, useValue: new MockMatDialog() },
        { provide: BackendService, useValue: new MockBackendService() }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupMonitorComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
