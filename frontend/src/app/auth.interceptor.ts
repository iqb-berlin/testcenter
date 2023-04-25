import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { MainDataService } from './shared/shared.module';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private mainDataService: MainDataService
  ) {
  }

  // eslint-disable-next-line class-methods-use-this
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('## AuthInterceptor', request.url);
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
