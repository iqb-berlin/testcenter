import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { TestSessionComponent } from './test-session.component';
import { TestViewDisplayOptions } from '../group-monitor.interfaces';
import { unitTestExampleSessions } from '../unit-test-example-data.spec';
import { TemplateContextDirective } from '../../shared/directives/template-context.directive';
import { PositionPipe } from './position.pipe';

describe('TestViewComponent', () => {
  let component: TestSessionComponent;
  let fixture: ComponentFixture<TestSessionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TestSessionComponent, PositionPipe],
      imports: [MatIconModule, MatTooltipModule, MatCheckboxModule, MatIconTestingModule, TemplateContextDirective]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestSessionComponent);
    component = fixture.componentInstance;
    component.testSession = unitTestExampleSessions[0];
    component.displayOptions = <TestViewDisplayOptions>{
      bookletColumn: 'hide',
      groupColumn: 'hide',
      blockColumn: 'hide',
      unitColumn: 'hide',
      view: 'medium',
      highlightSpecies: false
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
