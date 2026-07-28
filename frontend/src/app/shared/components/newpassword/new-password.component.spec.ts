import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { BackendService } from '@app/workspace-admin/backend.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { NewPasswordComponent } from './new-password.component';

class MockService {
  appConfig = {};
}

describe('NewpasswordComponent', () => {
  let component: NewPasswordComponent;
  let fixture: ComponentFixture<NewPasswordComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: BackendService, useValue: new MockService() },
        { provide: MainDataService, useValue: new MockService() },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
