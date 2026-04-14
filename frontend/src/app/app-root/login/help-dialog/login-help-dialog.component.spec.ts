import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { matIconRegistryMock } from '@app/test-controller/test/icon-registry-mock';
import { LoginHelpDialogComponent } from './login-help-dialog.component';

describe('LoginHelpDialogComponent', () => {
  let fixture: ComponentFixture<LoginHelpDialogComponent>;
  let component: LoginHelpDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginHelpDialogComponent, MatIconModule
      ],
      providers: [
        {
          provide: MatIconRegistry,
          useValue: matIconRegistryMock
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginHelpDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create a component', () => {
    expect(component).toBeTruthy();
  });
});
