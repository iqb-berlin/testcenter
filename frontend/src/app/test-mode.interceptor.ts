import { Inject, Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { MainDataService } from './shared/shared.module';

@Injectable()
export class TestModeInterceptor implements HttpInterceptor {
  constructor(
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean,
    private mds: MainDataService
  ) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isProductionMode) return next.handle(request);
    if (!this.mds.isTestingMode) return next.handle(request);
    const requestA = request.clone({
      setHeaders: {
        TestMode: 'integration'
      }
    });
    return next.handle(requestA);
  }
}
