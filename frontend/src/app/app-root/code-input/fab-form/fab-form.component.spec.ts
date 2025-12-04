import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabFormComponent } from './fab-form.component';

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

  });

  it('does not overflow, when the max limit of selected icons is reached', () => {

  });

  it('deletes all icons, when pushing the delete button', () => {

  });

  it('sends the request automatically, when icon bar is full', () => {

  });

  it('gives feedback, when the code is wrong', () => {

  });
});
