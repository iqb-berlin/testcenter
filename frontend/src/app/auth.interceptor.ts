import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent, HttpContextToken
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { MainDataService } from './shared/shared.module';

/** Set on requests that must go without the AuthToken header. */
export const SKIP_AUTH_TOKEN = new HttpContextToken<boolean>(() => false);

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private mainDataService: MainDataService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.context.get(SKIP_AUTH_TOKEN)) {
      return next.handle(request);
    }

    let tokenStr = '';
    const authData = this.mainDataService.getAuthData();
    if (authData && authData.token) {
      tokenStr = authData.token;
    }
    const requestA = request.clone({
      setHeaders: {
        AuthToken: tokenStr
      }
    });
    return next.handle(requestA);
  }
}
