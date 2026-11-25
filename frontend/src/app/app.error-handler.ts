import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { MessageService } from '@shared/services/message.service';
import { AppError, WrappedError } from './app.interfaces';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  // emits the error that opened the error dialog
  readonly fatalError$ = new Subject<AppError>();
  private isDialogOpen = false;

  constructor(
    private messageService: MessageService,
    private zone: NgZone
  ) {}

  handleError(error: Error | DOMException | AppError | WrappedError) {
    this.zone.run(() => {
      const appError = AppErrorHandler.toAppError(error);

      // closing the dialog reloads the page, so it stays open and the first error is the one shown
      if (this.isDialogOpen) {
        // eslint-disable-next-line no-console
        console.error(appError);
        return;
      }
      this.isDialogOpen = true;
      this.messageService.showErrorDialog(appError);
      this.fatalError$.next(appError);
    });
  }

  private static toAppError(error: Error | DOMException | AppError | WrappedError): AppError {
    // unwrap error, if it comes from an "Uncaught (in promise)"-error
    if ('promise' in error && 'rejection' in error && error.rejection) {
      // eslint-disable-next-line no-param-reassign
      error = error.rejection;
    }

    if (error instanceof AppError) {
      return error;
    }

    const stack = 'stack' in error ? error.stack : undefined;
    if (stack) {
      // eslint-disable-next-line no-console
      console.warn(stack);
    }

    if (
      error.constructor.name === 'Event' &&
      'type' in error &&
      error.type === 'error' &&
      'target' in error &&
      typeof error.target === 'object' &&
      error.target != null &&
      'url' in error.target
    ) {
      return new AppError({
        label: 'Unbekannter Netzwerkfehler',
        description: `Can not establish connection to \`${error.target.url}\``,
        details: stack
      });
    }

    return new AppError({
      label: `Programmfehler: ${error.name}`,
      description: error.message,
      details: stack
    });
  }
}
