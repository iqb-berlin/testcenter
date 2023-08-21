import { Inject, Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { MainDataService } from './shared/shared.module';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private mainDataService: MainDataService,
    @Inject('FASTLOAD_URL') public fastLoadUrl: string
  ) {
  }

  // eslint-disable-next-line class-methods-use-this
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let tokenStr = '';
    const authData = this.mainDataService.getAuthData();
    if (authData && authData.token) {
      tokenStr = authData.token;
    }

    const groupToken = authData?.groupToken ?? '';
    if (groupToken && request.url.startsWith(this.fastLoadUrl)) {
      tokenStr = groupToken;
    }

    const requestA = request.clone({
      setHeaders: {
        AuthToken: tokenStr
      }
    });
    return next.handle(requestA);
  }
}
