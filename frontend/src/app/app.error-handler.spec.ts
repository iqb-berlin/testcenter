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

  it('opens the dialog with the first error and emits it', () => {
    const emitted: AppError[] = [];
    handler.fatalError$.subscribe(error => emitted.push(error));
    const error = new AppError({ label: 'first', description: '' });

    handler.handleError(error);

    expect(messageService.showErrorDialog).toHaveBeenCalledOnceWith(error);
    expect(emitted).toEqual([error]);
  });

  it('only logs further errors while the dialog is open', () => {
    const emitted: AppError[] = [];
    handler.fatalError$.subscribe(error => emitted.push(error));
    const first = new AppError({ label: 'first', description: '' });
    const second = new AppError({ label: 'second', description: '' });

    handler.handleError(first);
    handler.handleError(second);

    expect(messageService.showErrorDialog).toHaveBeenCalledTimes(1);
    expect(emitted).toEqual([first]);
    expect(console.error).toHaveBeenCalledWith(second);
  });

  it('wraps other errors in an AppError', () => {
    handler.handleError(new TypeError('broken'));

    const data = messageService.showErrorDialog.calls.mostRecent().args[0];
    expect(data).toBeInstanceOf(AppError);
    expect(data.label).toBe('Programmfehler: TypeError');
    expect(data.description).toBe('broken');
    expect(data.sessionInvalid).toBeFalse();
  });

  it('unwraps rejected promises', () => {
    const rejection = new AppError({ label: 'rejected', description: '', sessionInvalid: true });

    handler.handleError(Object.assign(new Error(), { promise: Promise.resolve(), rejection }));

    expect(messageService.showErrorDialog.calls.mostRecent().args[0]).toBe(rejection);
  });
});
