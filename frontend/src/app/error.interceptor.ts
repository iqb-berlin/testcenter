import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppError, AppErrorType } from './app.interfaces';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  // eslint-disable-next-line class-methods-use-this
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('## ErrorInterceptor', request.url);
    // if (!this.mainDataService.appConfig) {
    //   this.mainDataService.appError$.next({
    //     label: 'Verbindung zum Server konnte nicht hergestellt werden!',
    //     description: 'AppConfig konnte nicht geladen werden.',
    //     category: 'ERROR'
    //   });
    //   return throwError(new ApiError(500, 'Verbindung zum Server konnte nicht hergestellt werden!'));
    // }

    return next.handle(request).pipe(
      catchError(error => {
        console.log('intercept', error);
        if (error instanceof HttpErrorResponse) {
          return throwError(ErrorInterceptor.handleHttpError(error));
        }
        if (error instanceof DOMException) {
          return throwError({
            label: `Fehler: ${error.name}`,
            description: error.message
          });
        }
        return throwError({
          label: 'Unbekannter Fehler',
          description: ''
        });
      })
    );
  }

  private static handleHttpError(httpError: HttpErrorResponse): AppError {
    if (httpError.error instanceof ProgressEvent) {
      console.log('httpError.error instanceof ProgressEvent');
      return new AppError({
        code: httpError.status,
        label: 'Netzwerkfehler',
        description: httpError.error.type,
        details: httpError.message,
        type: 'network',
        errorId: httpError.headers.get('error-id')
      });
    }

    if (httpError.error instanceof ErrorEvent) {
      console.log('httpError.error instanceof ErrorEvent');
      return new AppError({
        code: httpError.status,
        label: 'Fehler in der Netzwerkverbindung',
        description: httpError.error.message,
        type: 'network',
        details: httpError.message,
        errorId: httpError.headers.get('error-id')
      });
    }

    if (httpError.error instanceof Blob) {
      console.log('httpError.error instanceof Blob');
      httpError.error.text()
        .then(text => {
          throw new AppError({
            code: httpError.status,
            label: 'XYZg',
            description: text,
            type: 'network',
            details: `details:${httpError.message}`,
            errorId: httpError.headers.get('error-id')
          });
        });
      return null;
    }

    let statusMessage: string;
    let errorType: AppErrorType = 'backend';
    switch (httpError.status) {
      case 202:
      case 204:
      case 207:
      case 400:
        statusMessage = 'Fehlerhafte Daten';
        break;
      case 401:
        statusMessage = 'Bitte für diese Aktion erst anmelden!';
        errorType = 'session';
        break;
      case 403:
        statusMessage = 'Keine Berechtigung.';
        errorType = 'session';
        break;
      case 404:
        statusMessage = 'Daten/Objekt nicht gefunden.';
        break;
      case 410:
        statusMessage = 'Anmeldung abgelaufen oder noch nicht nötig. Bitte erneut anmelden!';
        errorType = 'session';
        // ignoreError = true;
        break;
      case 422:
        // apiError.info = ?? TODO - from request body
        // statusMessage = 'Die übermittelten Objekte sind fehlerhaft!';
        break;
      case 423:
        statusMessage = 'Test is gesperrt!';
        break;
      case 500:
        statusMessage = 'Allgemeines Server-Problem.';
        break;
      default:
        statusMessage = 'Unbekanntes Verbindungsproblem';
        errorType = 'network';
    }

    return new AppError({
      code: httpError.status,
      label: statusMessage,
      description: httpError.error ?? httpError.statusText,
      type: errorType,
      details: httpError.message,
      errorId: httpError.headers.get('error-id')
    });
  }
}
