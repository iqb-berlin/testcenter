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
import { AlertComponent } from '../../shared/shared.module';
import { SuperadminPasswordRequestComponent } from './superadmin-password-request.component';

describe('SuperadminPasswordRequestComponent', () => {
  let component: SuperadminPasswordRequestComponent;
  let fixture: ComponentFixture<SuperadminPasswordRequestComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SuperadminPasswordRequestComponent],
      imports: [
        MatDialogModule,
        ReactiveFormsModule,
        MatInputModule,
        MatFormFieldModule,
        NoopAnimationsModule,
        AlertComponent
      ],
      providers: [
        MatDialog,
        { provide: MAT_DIALOG_DATA, useValue: 'fonk' }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperadminPasswordRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not emit passwordSubmit when the form is invalid', () => {
    const emitSpy = spyOn(component.passwordSubmit, 'emit');
    component.passwordform.get('pw')?.setValue(''); // required + minLength(7) both fail
    component.submit();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit the entered password via passwordSubmit when the form is valid', () => {
    const emitSpy = spyOn(component.passwordSubmit, 'emit');
    component.passwordform.get('pw')?.setValue('correct-horse');
    component.submit();
    expect(emitSpy).toHaveBeenCalledWith('correct-horse');
  });

  it('should clear a previous error message on a new submit attempt', () => {
    component.errorMessage = 'Falsches Kennwort.';
    component.passwordform.get('pw')?.setValue('correct-horse');
    component.submit();
    expect(component.errorMessage).toBe('');
  });

  it('should clear the error message via clearError()', () => {
    component.errorMessage = 'Falsches Kennwort.';
    component.clearError();
    expect(component.errorMessage).toBe('');
  });

  it('should render the inline error alert only while errorMessage is set', () => {
    const getAlert = () => fixture.nativeElement.querySelector('[data-cy="dialog-change-superadmin-error"]');

    expect(getAlert()).toBeNull();

    component.errorMessage = 'Falsches Kennwort.';
    fixture.detectChanges();
    expect(getAlert()).not.toBeNull();
    expect(getAlert().textContent).toContain('Falsches Kennwort.');

    component.errorMessage = '';
    fixture.detectChanges();
    expect(getAlert()).toBeNull();
  });
});
