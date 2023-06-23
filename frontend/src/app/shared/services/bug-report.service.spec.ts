import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GitHubService } from './github.service';
import { BugReportService } from '../bug-report.service';

describe('GitHubService', () => {
  let service: GitHubService;
  let httpTestingController: HttpTestingController;

  const bugReport = {
    devInfo: 'some dev info',
    title: 'report title',
    comment: 'a comment',
    errorId: 'an error-id',
    reporterName: 'reporter\'s name',
    reporterEmail: 'reporter\'s mail',
    date: new Date(2020, 22, 2, 2, 22, 22),
    url: 'http://localhost/my-app/#here',
    product: 'my-app',
    version: '1.0.0',
    userAgent: 'test'
  };

  class MockBugReportService {
    // eslint-disable-next-line class-methods-use-this
    toText() {
      return 'bug report as text';
    }

    // eslint-disable-next-line class-methods-use-this
    applyDefaults(any) {
      return any;
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        GitHubService,
        {
          provide: 'GITHUB_DATA',
          useValue: {
            user: 'github-username',
            token: 'github-token',
            repositoryUrls: {
              an_url: 'https://github.com/my/repository/',
              a_second_url: 'https://github.com/my/repository.git',
              a_third_url: 'https://www.github.com/my/repository/'
            }
          }
        },
        {
          provide: BugReportService,
          useValue: new MockBugReportService()
        }
      ]
    }).compileComponents();

    // Returns a service with the MockBackend so we can test with dummy responses
    service = TestBed.inject(GitHubService);
    // Inject the http service and test controller for each test
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpTestingController.verify();
  });

  it('should convert provided GitHub-URLs into targets in constructor', () => {
    expect(service.targets).toEqual({
      an_url: { owner: 'my', name: 'repository' },
      a_second_url: { owner: 'my', name: 'repository' },
      a_third_url: { owner: 'my', name: 'repository' }
    });
  });

  it('should return full issues url on getTargetName()', () => {
    expect(service.getTargetName('a_second_url'))
      .toEqual('https://github.com/my/repository/issues');
  });

  it('should return success:true and url on successful publishIssue()', fakeAsync(() => {
    // Perform a request (this is fakeAsync to the response won't be called until tick() is called)
    service.publishIssue(bugReport, 'an_url')
      .subscribe(result => {
        expect(result).toEqual({
          uri: 'https://github.com/my/repository/issues/1',
          message: 'Bug reported to GitHub: https://github.com/my/repository/issues/1',
          success: true
        });
      });

    // Expect a call to this URL
    const req = httpTestingController.expectOne(
      'https://api.github.com/repos/my/repository/issues'
    );

    // Assert that the request is a GET.
    expect(req.request.method).toEqual('POST');

    // Respond with this data when called
    req.flush({
      url: 'https://github.com/my/repository/issues/1'
    });

    // Call tick which actually processes the response
    tick();
  }));

  it('should return success:false on invalid targetKey', fakeAsync(() => {
    service.publishIssue(bugReport, 'an_invalid_url')
      .subscribe(result => {
        expect(result.success).toBeFalsy();
      });
    tick();
  }));

  it('should return success:false on publish error', fakeAsync(() => {
    service.publishIssue(bugReport, 'an_url')
      .subscribe(result => {
        expect(result.success).toBeFalsy();
      });

    const req = httpTestingController.expectOne(
      'https://api.github.com/repos/my/repository/issues'
    );

    req.error(
      new ErrorEvent('some error'),
      {
        status: 401,
        statusText: 'Unauthorized'
      }
    );

    tick();
  }));
});
