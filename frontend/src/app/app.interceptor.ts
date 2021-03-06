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
    private mds: MainDataService,
    private router: Router
  ) {}

  // TODO separation of concerns: split into two interceptors,
  // one for error handling, one for auth token addition
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // if (!this.mds.appConfig) {
    //   this.mds.appError$.next({
    //     label: 'Verbindung zum Server konnte nicht hergestellt werden!',
    //     description: 'AppConfig konnte nicht geladen werden.',
    //     category: 'ERROR'
    //   });
    //   return throwError(new ApiError(500, 'Verbindung zum Server konnte nicht hergestellt werden!'));
    // }

    let tokenStr = '';
    const authData = MainDataService.getAuthData();
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
        const apiError = new ApiError(999);
        if (error instanceof HttpErrorResponse) {
          const httpError = error as HttpErrorResponse;
          apiError.code = httpError.status;
          apiError.info = `${httpError.message} // ${httpError.error}`;
          if (httpError.error instanceof ErrorEvent) {
            this.mds.appError$.next({
              label: 'Fehler in der Netzwerkverbindung',
              description: httpError.message,
              category: 'ERROR'
            });
          } else {
            let ignoreError = false;
            let goToLoginPage = false;
            let label;
            let isError = false;
            switch (httpError.status) {
              case 202:
              case 204:
              case 207:
              case 400:
                ignoreError = true;
                // apiError.info contains error = body
                break;

              case 401:
                goToLoginPage = true;
                label = 'Bitte f??r diese Aktion erst anmelden!';
                break;

              case 403:
                label = 'F??r diese Funktion haben Sie keine Berechtigung.';
                break;

              case 404:
                label = 'Daten/Objekt nicht gefunden.';
                break;

              case 410:
                goToLoginPage = true;
                label = 'Anmeldung abgelaufen. Bitte erneut anmelden!';
                break;

              case 422:
                ignoreError = true;
                // apiError.info = ?? TODO - from request body
                label = 'Die ??bermittelten Objekte sind fehlerhaft!';
                break;

              case 423:
                label = 'Test is gesperrt!';
                break;

              case 500:
                label = 'Allgemeines Server-Problem.';
                isError = true;
                break;

              default:
                label = 'Unbekanntes Verbindungsproblem';
                isError = true;
            }
            if (!ignoreError) {
              this.mds.appError$.next({
                label,
                description: httpError.message,
                category: isError ? 'ERROR' : 'WARNING'
              });
              if (goToLoginPage) {
                console.warn(`AuthError ${httpError.status} (${label})`);
                this.mds.resetAuthData();
                const state: RouterState = this.router.routerState;
                const { snapshot } = state;
                const snapshotUrl = (snapshot.url === '/r/login/') ? '' : snapshot.url;
                this.router.navigate(['/r/login', snapshotUrl]);
              }
            }
          }
        } else if (error instanceof DOMException) {
          apiError.info = `Fehler: ${error.name} // ${error.message}`;
          this.mds.appError$.next({
            label: `Fehler: ${error.name}`,
            description: error.message,
            category: 'ERROR'
          });
        } else {
          apiError.info = 'Unbekannter Fehler';
          this.mds.appError$.next({
            label: 'Unbekannter Fehler',
            description: '',
            category: 'ERROR'
          });
        }

        return throwError(apiError);
      })
    );
  }
}
