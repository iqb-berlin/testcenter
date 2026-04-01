import { TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AppModule } from './app.module';

describe('AppModule', () => {
  let appModule: AppModule;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppModule,
        MatIconRegistry,
        DomSanitizer
      ]
    });

    appModule = TestBed.inject(AppModule);
  });

  it('should create an instance', () => {
    expect(appModule).toBeTruthy();
  });
});
