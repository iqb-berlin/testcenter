import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { TestSessionComponent } from './test-session.component';
import { Testlet, TestViewDisplayOptions } from '../group-monitor.interfaces';
import { unitTestExampleBooklets, unitTestExampleSessions } from '../unit-test-example-data.spec';
import { TemplateContextDirective } from '../../shared/directives/template-context.directive';
import { PositionPipe } from './position.pipe';
import { TestletvisiblePipe } from './testletvisible.pipe';

describe('TestViewComponent', () => {
  let component: TestSessionComponent;
  let fixture: ComponentFixture<TestSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestSessionComponent, PositionPipe, TestletvisiblePipe],
      imports: [MatIconModule, MatTooltipModule, MatCheckboxModule, MatIconTestingModule, TemplateContextDirective]
    })
      .compileComponents();
  });

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

  it('should show only the blocks of the test in the medium view', () => {
    const block = (id: string, level?: string): Testlet => ({
      id,
      label: id,
      blockId: id,
      descendantCount: 0,
      children: [],
      restrictions: level ? { show: { if: 'level', is: level } } : { }
    });
    // an adaptive booklet: a base module and two supplementary modules, of which a test gets only one
    component.testSession = {
      ...unitTestExampleSessions[0],
      current: null,
      booklet: {
        ...unitTestExampleBooklets.example_booklet_1,
        states: {
          level: {
            id: 'level',
            label: 'Level',
            options: {
              easy: { id: 'easy', label: 'Easy', conditions: [] },
              hard: { id: 'hard', label: 'Hard', conditions: [] }
            },
            default: 'easy'
          }
        },
        units: { ...block('root'), children: [block('base'), block('easy', 'easy'), block('hard', 'hard')] }
      },
      bookletStates: { level: 'hard' }
    };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.units .testlet').length).toBe(2);
  });
});
