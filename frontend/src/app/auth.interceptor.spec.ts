import { TestBed } from '@angular/core/testing';
import {
  HTTP_INTERCEPTORS, HttpClient, HttpContext, provideHttpClient, withInterceptorsFromDi
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthInterceptor, SKIP_AUTH_TOKEN } from './auth.interceptor';
import { MainDataService } from './shared/shared.module';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: MainDataService, useValue: { getAuthData: () => ({ token: 'person-token' }) } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('sends the AuthToken header', () => {
    http.get('/api/some-route').subscribe();

    const request = httpTesting.expectOne('/api/some-route');
    expect(request.request.headers.get('AuthToken')).toBe('person-token');
    request.flush({});
  });

  it('leaves the AuthToken header out when the request skips it', () => {
    http.get('/fs/file/group-token/ws_1/Resource/player.html', {
      context: new HttpContext().set(SKIP_AUTH_TOKEN, true)
    }).subscribe();

    const request = httpTesting.expectOne('/fs/file/group-token/ws_1/Resource/player.html');
    expect(request.request.headers.has('AuthToken')).toBeFalse();
    request.flush('');
  });
});
