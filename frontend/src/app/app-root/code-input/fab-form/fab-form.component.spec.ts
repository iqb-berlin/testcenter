import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabFormComponent } from './fab-form.component';
import { By } from '@angular/platform-browser';

describe('FabFormComponent', () => {
  let component: FabFormComponent;
  let fixture: ComponentFixture<FabFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabFormComponent);
    component = fixture.componentInstance;
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

  });

  it('gives feedback, when the code is wrong', () => {

  });
});
