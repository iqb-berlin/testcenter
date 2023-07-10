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
    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => ErrorInterceptor.handleHttpError(error));
        }
        if (error instanceof DOMException) {
          return throwError(() => {
            throw new AppError({
              label: `Fehler: ${error.name}`,
              description: error.message
            });
          });
        }
        return throwError(() => {
          throw new AppError({
            label: 'Unbekannter Fehler',
            description: error.prototype.name
          });
        });
      })
    );
  }

  private static handleHttpError(httpError: HttpErrorResponse): AppError | null {
    if (httpError.error instanceof ProgressEvent) {
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
      httpError.error.text()
        .then(text => {
          throw new AppError({
            code: httpError.status,
            label: 'Download konnte nicht bereitgestellt werden!',
            description: text,
            type: 'network',
            details: httpError.message,
            errorId: httpError.headers.get('error-id')
          });
        });
      return null;
    }

    let statusMessage: string;
    let errorType: AppErrorType = 'backend';
    let description = '';
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
        statusMessage = 'Sitzung nicht mehr gültig.';
        errorType = 'session';
        break;
      case 404:
        statusMessage = 'Daten/Objekt nicht gefunden.';
        break;
      case 410:
        statusMessage = 'Anmeldung abgelaufen oder noch nicht gültig. Bitte erneut anmelden!';
        errorType = 'session';
        break;
      case 423:
        statusMessage = 'Test ist gesperrt!';
        break;
      case 500:
        statusMessage = 'Allgemeines Server-Problem.';
        break;
      case 503:
        statusMessage = 'Der Server ist augenblicklich nicht erreichbar';
        errorType = 'network_temporally';
        break;
      default:
        statusMessage = 'Unbekanntes Verbindungsproblem';
        errorType = 'network';
    }

    if (typeof httpError.error === 'string') {
      description = httpError.error;
    } else if (
      httpError.error &&
      (typeof httpError.error === 'object') &&
      ('text' in httpError.error) &&
      ('error' in httpError.error)
    ) {
      description = `${httpError.error.error}: ${httpError.error.text}`;
    } else if (httpError.statusText) {
      description = httpError.statusText;
    }

    return new AppError({
      code: httpError.status,
      label: statusMessage,
      description: description,
      type: errorType,
      details: httpError.message,
      errorId: httpError.headers.get('error-id')
    });
  }
}
