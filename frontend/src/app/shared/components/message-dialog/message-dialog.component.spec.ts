import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MessageDialogComponent } from './message-dialog.component';

describe('MessageDialogComponent', () => {
  let fixture: ComponentFixture<MessageDialogComponent>;
  let component: MessageDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MessageDialogComponent
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            type: 0,
            title: '',
            content: 'content',
            closebuttonlabel: 'close'
          }
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(MessageDialogComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should create a component', async () => {
    expect(component).toBeTruthy();
  });

  it('should take default properties for those which are omitted on #ngOnInit()', async () => {
    component.ngOnInit();
    expect(component.msgdata.title).toEqual('Hinweis');
  });
});
