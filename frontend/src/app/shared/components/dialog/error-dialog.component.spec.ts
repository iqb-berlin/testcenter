import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppError } from '@app/app.interfaces';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { CustomtextService } from '@shared/services/customtext/customtext.service';
import { ErrorDialogComponent } from './error-dialog.component';

describe('ErrorDialogComponent', () => {
  const renderText = (isTestTaker: boolean, sessionInvalid: boolean): string => {
    TestBed.configureTestingModule({
      imports: [ErrorDialogComponent, MatIconTestingModule, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: new AppError({ label: 'label', description: '', sessionInvalid }) },
        {
          provide: MainDataService,
          useValue: { getAuthData: () => null, isTestTaker: () => isTestTaker, reloadPage: () => {} }
        }
      ]
    });
    TestBed.inject(CustomtextService).addCustomTexts({
      booklet_errormessage: 'custom error',
      booklet_sessionerrormessage: 'custom session error'
    });
    const fixture = TestBed.createComponent(ErrorDialogComponent);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('mat-dialog-content > p')?.textContent?.trim() ?? '';
  };

  it('shows test takers the custom error text', () => {
    expect(renderText(true, false)).toBe('custom error');
  });

  it('shows test takers the custom session text for invalid sessions', () => {
    expect(renderText(true, true)).toBe('custom session error');
  });

  it('shows everyone else the generic text', () => {
    expect(renderText(false, false)).toContain('Es ist ein Fehler aufgetreten.');
  });

  it('shows everyone else the session text for invalid sessions', () => {
    expect(renderText(false, true)).toContain('Die Sitzung ist nicht mehr gültig');
  });
});
