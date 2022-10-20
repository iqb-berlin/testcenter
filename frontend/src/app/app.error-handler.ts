import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { MainDataService } from './shared/shared.module';
import { AppError } from './app.interfaces';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  constructor(
    private mainDataService: MainDataService,
    private zone: NgZone
  ) {}

  handleError(error: any) {
    this.zone.run(() => {
      console.log('AppErrorHandler', error);

      // unwrap error, if it comes from an "Uncaught (in promise)"-error
      if (error.promise && error.rejection) {
        console.log('!!!! i am', error);
        // eslint-disable-next-line no-param-reassign
        error = error.rejection;
      }

      if (error instanceof AppError) {
        this.mainDataService.appError$.next(error);
        return;
      }

      this.mainDataService.appError$.next(new AppError({
        type: 'general',
        label: `Programmfehler: ${error.name}`,
        description: error.message,
        details: error.stack
      }));
    });
  }
}
