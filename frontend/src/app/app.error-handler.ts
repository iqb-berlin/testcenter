import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { MainDataService } from './shared/shared.module';
import { AppError, WrappedError } from './app.interfaces';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  constructor(
    private mainDataService: MainDataService,
    private zone: NgZone
  ) {}

  handleError(error: Error | DOMException | AppError | WrappedError) {
    this.zone.run(() => {
      // unwrap error, if it comes from an "Uncaught (in promise)"-error
      if ('promise' in error && 'rejection' in error && error.rejection) {
        // eslint-disable-next-line no-param-reassign
        error = error.rejection;
      }

      if (error instanceof AppError) {
        this.mainDataService.appError = error;
        return;
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
        this.mainDataService.appError = new AppError({
          type: 'network',
          label: 'Unbekannter Netzwerkfehler',
          description: `Can not establish connection to \`${error.target.url}\``,
          details: stack
        });
        return;
      }

      this.mainDataService.appError = new AppError({
        type: 'script',
        label: `Programmfehler: ${error.name}`,
        description: error.message,
        details: stack
      });
    });
  }
}
