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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
