import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { BackendService } from '@app/workspace-admin/backend.service';
import { MainDataService } from '@shared/shared.module';
import { NewUserComponent } from './new-user.component';

class MockService {
  appConfig = {};
}

describe('NewuserComponent', () => {
  let component: NewUserComponent;
  let fixture: ComponentFixture<NewUserComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {}
        },
        { provide: BackendService, useValue: new MockService() },
        { provide: MainDataService, useValue: new MockService() }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
