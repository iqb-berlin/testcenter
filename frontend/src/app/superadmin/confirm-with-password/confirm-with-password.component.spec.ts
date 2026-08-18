import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmWithPasswordComponent } from './confirm-with-password.component';

describe('ConfirmWithPasswordComponent', () => {
  let component: ConfirmWithPasswordComponent;
  let fixture: ComponentFixture<ConfirmWithPasswordComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmWithPasswordComponent],
      imports: [
        MatDialogModule,
        ReactiveFormsModule,
        MatInputModule,
        MatFormFieldModule,
        NoopAnimationsModule
      ],
      providers: [
        MatDialog,
        { provide: MAT_DIALOG_DATA, useValue: { title: 'fonk' } }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmWithPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
