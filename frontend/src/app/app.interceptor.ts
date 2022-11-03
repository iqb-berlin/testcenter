import { Injectable } from '@angular/core';
import { Router, RouterState } from '@angular/router';
import {
  HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MainDataService } from './shared/shared.module';
import { ApiError } from './app.interfaces';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private mainDataService: MainDataService,
    private router: Router
  ) {}

  // TODO separation of concerns: split into two interceptors,
  // one for error handling, one for auth token addition
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // if (!this.mainDataService.appConfig) {
    //   this.mainDataService.appError$.next({
    //     label: 'Verbindung zum Server konnte nicht hergestellt werden!',
    //     description: 'AppConfig konnte nicht geladen werden.',
    //     category: 'ERROR'
    //   });
    //   return throwError(new ApiError(500, 'Verbindung zum Server konnte nicht hergestellt werden!'));
    // }

    let tokenStr = '';
    const authData = this.mainDataService.getAuthData();
    if (authData) {
      if (authData.token) {
        tokenStr = authData.token;
      }
    }

    const requestA = request.clone({
      setHeaders: {
        AuthToken: tokenStr
      }
    });

    return next.handle(requestA).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          return throwError(this.handleHttpError(error));
        }
        const apiError = new ApiError(999); // TODO why 999?
        if (error instanceof DOMException) {
          apiError.info = `Fehler: ${error.name} // ${error.message}`;
          this.mainDataService.appError$.next({
            label: `Fehler: ${error.name}`,
            description: error.message,
            category: 'ERROR'
          });
        } else {
          apiError.info = 'Unbekannter Fehler';
          this.mainDataService.appError$.next({
            label: 'Unbekannter Fehler',
            description: '',
            category: 'ERROR'
          });
        }

        return throwError(apiError);
      })
    );
  }

  handleHttpError(httpError: HttpErrorResponse): ApiError {
    const apiError = new ApiError(httpError.status, `${httpError.message} // ${httpError.error}`);
    if (httpError.error instanceof ErrorEvent) {
      this.mainDataService.appError$.next({
        label: 'Fehler in der Netzwerkverbindung',
        description: httpError.message,
        category: 'ERROR'
      });
    } else {
      let statusMessage: string | null = null;
      let isError = false;
      switch (httpError.status) {
        case 202:
        case 204:
        case 207:
        case 400:
          // apiError.info contains error = body
          break;
        case 401:
          this.handleInvalidSessionError(httpError, 'Bitte für diese Aktion erst anmelden!');
          break;
        case 403:
          statusMessage = 'Für diese Funktion haben Sie keine Berechtigung.';
          break;
        case 404:
          statusMessage = 'Daten/Objekt nicht gefunden.';
          break;
        case 410:
          this.handleInvalidSessionError(httpError, 'Anmeldung abgelaufen. Bitte erneut anmelden!');
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
          isError = true;
          break;
        default:
          statusMessage = 'Unbekanntes Verbindungsproblem';
          isError = true;
      }
      if (statusMessage) {
        this.mainDataService.appError$.next({
          label: statusMessage,
          description: httpError.message,
          category: isError ? 'ERROR' : 'WARNING'
        });
      }
    }
    return apiError;
  }

  handleInvalidSessionError(httpError: HttpErrorResponse, errorMessage: string): void {
    console.warn(`AuthError ${httpError.status} (${errorMessage})`);
    this.mainDataService.appError$.next({
      label: errorMessage,
      description: httpError.message,
      category: 'WARNING'
    });
    this.mainDataService.resetAuthData();
    const state: RouterState = this.router.routerState;
    const { snapshot } = state;
    const snapshotUrl = (snapshot.url === '/r/login/') ? '' : snapshot.url;
    this.router.navigate(['/r/login', snapshotUrl]);
  }
}
