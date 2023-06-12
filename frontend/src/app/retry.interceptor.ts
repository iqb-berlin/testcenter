import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen } from 'rxjs/operators';
import { HttpRetryPolicy, HttpRetryPolicyNames } from './app.interfaces';

const retryPolicies: { [name in HttpRetryPolicyNames]: HttpRetryPolicy } = {
  test: {
    excludedStatusCodes: [401, 403],
    retryPattern: [] // 50, 500, 1000, 2000
  },
  none: {
    excludedStatusCodes: [],
    retryPattern: []
  }
};

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  constructor(
    private route: ActivatedRoute
  ) {}

  // eslint-disable-next-line class-methods-use-this
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const routeData = this.route.firstChild?.routeConfig?.data ?? { httpRetryPolicy: 'none' };
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const retryPolicyName = routeData['httpRetryPolicy'];
    const retryPolicy = retryPolicies[retryPolicyName] ?? retryPolicies.none;
    return next.handle(request)
      .pipe(
        retryWhen(
          (attempts: Observable<any>) => attempts.pipe(
            mergeMap((error, i) => {
              const retryAttempt = i + 1;
              if (retryAttempt > retryPolicy.retryPattern.length || retryPolicy.excludedStatusCodes.find(e => e === error.status)) {
                return throwError(error);
              }
              console.log(`Attempt ${retryAttempt}: retrying in ${retryPolicy.retryPattern[i]}ms`);
              return timer(retryPolicy.retryPattern[i]);
            })
          )
        )
      );
  }
}
