import { TestBed } from '@angular/core/testing';
import { MessageService } from '@shared/services/message.service';
import { AppErrorHandler } from './app.error-handler';
import { AppError } from './app.interfaces';

describe('AppErrorHandler', () => {
  let handler: AppErrorHandler;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    messageService = jasmine.createSpyObj<MessageService>('MessageService', ['showErrorDialog']);
    TestBed.configureTestingModule({
      providers: [
        AppErrorHandler,
        { provide: MessageService, useValue: messageService }
      ]
    });
    handler = TestBed.inject(AppErrorHandler);
    spyOn(console, 'error');
    spyOn(console, 'warn');
  });

  it('shows and emits the first error and only logs further ones', () => {
    const emitted: AppError[] = [];
    handler.fatalError$.subscribe(error => emitted.push(error));
    const first = new AppError({ label: 'first', description: '' });
    const second = new AppError({ label: 'second', description: '' });

    handler.handleError(first);
    handler.handleError(second);

    expect(messageService.showErrorDialog.calls.allArgs()).toEqual([[first]]);
    expect(emitted).toEqual([first]);
    expect(console.error).toHaveBeenCalledWith(second);
  });

  it('wraps other errors in an AppError', () => {
    handler.handleError(new TypeError('broken'));

    expect(messageService.showErrorDialog.calls.mostRecent().args[0].label).toBe('Programmfehler: TypeError');
  });

  it('unwraps rejected promises', () => {
    const rejection = new AppError({ label: 'rejected', description: '' });

    handler.handleError(Object.assign(new Error(), { promise: Promise.resolve(), rejection }));

    expect(messageService.showErrorDialog.calls.mostRecent().args[0]).toBe(rejection);
  });
});
