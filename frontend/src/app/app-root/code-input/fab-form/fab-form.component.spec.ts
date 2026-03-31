import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FabFormComponent } from './fab-form.component';
import { BackendService } from '../../../backend.service';
import { MainDataService } from '../../../shared/services/maindata/maindata.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('FabFormComponent', () => {
  let component: FabFormComponent;
  let fixture: ComponentFixture<FabFormComponent>;
  let backendService: BackendService;

  beforeEach(async () => {
    const backendServiceSpy = jasmine.createSpyObj('BackendService', ['codeLogin']);
    const mainDataServiceSpy = jasmine.createSpyObj('MainDataService', ['logOut', 'setAuthData']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [FabFormComponent],
      providers: [
        {
          provide: BackendService,
          useValue: backendServiceSpy
        },
        {
          provide: MainDataService,
          useValue: mainDataServiceSpy
        },
        {
          provide: Router,
          useValue: routerSpy
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabFormComponent);
    component = fixture.componentInstance;
    backendService = TestBed.inject(BackendService);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('adds the right icon to select bar', () => {
    const { debugElement } = fixture;
    const gridIconFirst = debugElement.query(By.css('[data-gridPos="0-0"]'))
    const expectedIcon = gridIconFirst.query(By.css('mat-icon')).nativeElement.textContent.trim();

    gridIconFirst.triggerEventHandler('click', null);
    fixture.detectChanges();

    const selectedIcon = debugElement.query(By.css('[data-selectedPos="0"]'));
    const actualIcon = selectedIcon.query(By.css('mat-icon')).nativeElement.textContent.trim();

    expect(actualIcon).toBe(expectedIcon);
  });

  it('deletes all icons, when pushing the delete button', () => {
    const { debugElement } = fixture;
    // Arrange
    const [gridIcon0, gridIcon1] = debugElement.queryAll(By.css('[data-gridPos]'));
    const getNumberOfEmptyIcons = () => debugElement.queryAll(By.css('.placeholder')).length;

    gridIcon0.triggerEventHandler('click', null);
    gridIcon1.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(getNumberOfEmptyIcons()).toBe(3);

    // Act
    const deleteButton = debugElement.query(By.css('.delete-button'));
    deleteButton.triggerEventHandler('click', null);

    // Assert
    expect(getNumberOfEmptyIcons()).toBe(5);
  });

  it('sends the request automatically, when icon bar is full', () => {
    // returnValue is necessary, so that this.bs.codeLogin(this.encodedCode()).subscribe has something to subscribe to
    // {claims: {test: []}} is necessary, as the this.bs.codeLogin(this.encodedCode()).subscribe({next: () => {}}) always looks into claims.test
    (backendService.codeLogin as jasmine.Spy).and.returnValue(of({ claims: { test: [] } }));

    const { debugElement } = fixture;
    const gridIcons = debugElement.queryAll(By.css('[data-gridPos]'));

    for (let i = 0; i < 5; i++) {
      gridIcons[i].triggerEventHandler('click', null);
    }
    fixture.detectChanges();

    expect(backendService.codeLogin).toHaveBeenCalledTimes(1);
    expect(backendService.codeLogin).toHaveBeenCalledWith('12345');
  });

  it('shows an error text, if the login request failed', () => {
    (backendService.codeLogin as jasmine.Spy).and.returnValue(throwError(() => ({
      code: 400,
    })));

    const { debugElement } = fixture;
    const gridIcons = debugElement.queryAll(By.css('[data-gridPos]'));

    for (let i = 0; i < 5; i++) {
      gridIcons[i].triggerEventHandler('click', null);
    }
    fixture.detectChanges();


    const errorMessage = debugElement.query(By.css('.error-message')).nativeElement.textContent;
    expect(errorMessage).toEqual('Der Code ist leider nicht gültig. Bitte noch einmal versuchen');
  })

  it('makes the code input red, when the code is wrong', () => {

  });

  it('keeps the input icons after failed request', () => {

  });

  it('changes the helper text after failed request', () => {

  });

  it('inputs the same code under the hood, no matter how icons look like', () => {

  });

  it('', () => {

  })
});
