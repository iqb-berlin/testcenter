<?php /** @noinspection PhpUnhandledExceptionInspection */

declare(strict_types=1);

use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Slim\Exception\HttpUnauthorizedException;

class SessionControllerInjector extends SessionController {
  public static function injectSessionDAO(SessionDAO $sessionDao): void {
    SessionController::$_sessionDAO = $sessionDao;
  }

  public static function injectTestDAO(TestDAO $testDAO): void {
    SessionController::$_testDAO = $testDAO;
  }

  public static function injectAdminDAO(AdminDAO $adminDAO): void {
    SessionController::$_adminDAO = $adminDAO;
  }

  public static function injectWorkspaceDAO(WorkspaceDAO $workspaceDAO): void {
    SessionController::$_workspaceDAO = $workspaceDAO;
  }

  public static function injectWorkspace(Workspace $bookletsFolder, int $workspaceId): void {
    self::$_workspaces[$workspaceId] = $bookletsFolder;
  }
}

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class SessionControllerTest extends TestCase {
  function setUp(): void {
    require_once "test/unit/mock-classes/ExternalFileMock.php";
    require_once "test/unit/test-helper/RequestCreator.class.php";
    require_once "test/unit/test-helper/ResponseCreator.class.php";
    require_once "test/unit/TestDB.class.php";

    $mockBooklet = $this->createMock('XMLFileBooklet');
    $mockBooklet
      ->method('getLabel')
      ->willReturn('A BOOKLET LABEL READ FROM FILE');
    $mockWorkspace = $this->createMock('Workspace');
    $mockWorkspace
      ->method('getFileById')
      ->willReturn($mockBooklet);

    SystemConfig::$cacheService_host = '';
    SystemConfig::$broadcastingService_external = '';
    SystemConfig::$broadcastingService_internal = '';

    SessionControllerInjector::injectWorkspace($mockWorkspace, 1);
  }

  private function mockSessionDAO(array $functionsAndResults, array $expectFunctionCalls = []): void {
    $daoStub = $this->createMock('SessionDAO');
    $this->addMockFunctions($daoStub, $functionsAndResults, $expectFunctionCalls);
    SessionControllerInjector::injectSessionDAO($daoStub);
  }

  private function mockTestDAO(array $functionsAndResults, array $expectFunctionCalls = []): void {
    $daoStub = $this->createMock('TestDAO');
    $this->addMockFunctions($daoStub, $functionsAndResults, $expectFunctionCalls);
    SessionControllerInjector::injectTestDAO($daoStub);
  }

  private function mockAdminDAO(array $functionsAndResults, array $expectFunctionCalls = []): void {
    $daoStub = $this->createMock('AdminDAO');
    $this->addMockFunctions($daoStub, $functionsAndResults, $expectFunctionCalls);
    SessionControllerInjector::injectAdminDAO($daoStub);
  }

  private function mockWorkspaceDAO(array $functionsAndResults, array $expectFunctionCalls = []): void {
    $daoStub = $this->createMock('WorkspaceDAO');
    $this->addMockFunctions($daoStub, $functionsAndResults, $expectFunctionCalls);
    SessionControllerInjector::injectWorkspaceDAO($daoStub);
  }

  private function addMockFunctions(MockObject $mockObject, array $functionsAndResults, array $expectFunctionCalls = []): void {
    foreach ($functionsAndResults as $function => $result) {
      $method = $mockObject
        ->expects(isset($expectFunctionCalls[$function]) ? $this->exactly($expectFunctionCalls[$function]) : $this->any())
        ->method($function);

      if ($result instanceof Exception) {
        $method->willThrowException($result);

      } else if (is_callable($result)) {
        $method->willReturnCallback($result);

      } else {
        $method->willReturn($result);
      }
    }
  }

  public function test_putSessionLogin_loginThatRequiresCode(): void {
    $this->mockSessionDAO([
      'getOrCreateLoginSession' => new LoginSession(
        1,
        'some_token',
        'group-token',
        new Login(
          'sample_user',
          'password_hash',
          'run-hot-return',
          'sample_group',
          'Sample Group',
          ['aaa' => ['THE_BOOKLET']],
          1
        )
      )
    ]);

    $response = SessionController::putSessionLogin(
      RequestCreator::create('PUT', '/session/login', '{"name":"test", "password":"user123"}'),
      ResponseCreator::createEmpty()
    );

    $response->getBody()->rewind();

    $this->assertEquals(
      '{"token":"some_token","displayName":"Sample Group\/sample_user","customTexts":{},"flags":["codeRequired"],"claims":{},"groupToken":"group-token","access":{}}',
      $response->getBody()->getContents()
    );
    $this->assertEquals(200, $response->getStatusCode());
  }

  public function test_putSessionLogin_throwExceptionIfErrorWasThrown(): void {
    // happens when login is expired

    $this->mockSessionDAO([
      'getOrCreateLoginSession' => new Exception("some message")
    ]);

    $this->expectException(Exception::class);

    SessionController::putSessionLogin(
      RequestCreator::create('PUT', '/session/login', '{"name":"test", "password":"foo"}'),
      ResponseCreator::createEmpty()
    );
  }

  public function test_putSessionLogin_throwExceptionNoLOginFound(): void {
    // happens im login is expired for example

    $this->mockSessionDAO([
      'getOrCreateLoginSession' => null
    ]);

    $this->expectException(Exception::class);

    SessionController::putSessionLogin(
      RequestCreator::create('PUT', '/session/login', '{"name":"test", "password":"foo"}'),
      ResponseCreator::createEmpty()
    );
  }

  public function test_putSessionLogin_returnPersonSessionIfNoCodeRequired(): void {
    $loginSession = new LoginSession(
      1,
      'some_token',
      'group-token',
      new Login(
        'sample_user',
        'password_hash',
        'run-hot-return',
        'sample_group',
        'Sample Group',
        ['' => ['THE_BOOKLET']],
        1
      )
    );

    $this->mockSessionDAO([
      'getOrCreateLoginSession' => $loginSession,
      'createOrUpdatePersonSession' => new PersonSession(
        $loginSession,
        new Person(1, 'new_token', '', '')
      ),
      'getTestsOfPerson' => [
        new TestData(
          1,
          'THE_BOOKLET',
          'Label of THE_BOOKLET',
          'Description',
          true,
          false,
          (object) []
        )
      ]
    ]);

    $response = SessionController::putSessionLogin(
      RequestCreator::create('PUT', '/session/login', '{"name":"sample_user", "password":"foo"}'),
      ResponseCreator::createEmpty()
    );

    $response->getBody()->rewind();

    $this->assertEquals(
      '{"token":"new_token","displayName":"Sample Group\/sample_user","customTexts":{},"flags":[],"claims":{"test":[{"label":"Label of THE_BOOKLET","id":"THE_BOOKLET","type":"test","flags":{"locked":true,"running":false}}]},"groupToken":"group-token","access":{"test":["THE_BOOKLET"]}}',
      $response->getBody()->getContents()
    );
    $this->assertEquals(200, $response->getStatusCode());
  }

  public function test_putSessionLogin_registerGroupIfMonitor(): void {
    $loginSessionMonitor = new LoginSession(
      1,
      'some_token',
      'group-token',
      new Login(
        'test-monitor',
        'password_hash',
        'monitor-group',
        'sample_group',
        'Sample Group',
        ['' => ['THE_BOOKLET']],
        1
      )
    );

    $loginTesteeA = new Login(
      'test',
      'password_hash',
      'run-hot-return',
      'sample_group',
      'Sample Group',
      ['aaa' => ['THE_BOOKLET'], 'yyy' => ['THE_BOOKLET'], 'zzz' => ['THE_BOOKLET'], 'xxx' => ['THE_BOOKLET']],
      1
    );

    $loginTesteeB = new Login(
      'testeeB',
      'password_hash',
      'run-hot-return',
      'sample_group',
      'Sample Group',
      ['' => ['THE_BOOKLET', 'THE_OTHER_BOOKLET']],
      1
    );

    $this->mockSessionDAO(
      [
        'getOrCreateLoginSession' => $loginSessionMonitor,
        'createLoginSession' => function(Login $login): LoginSession {
          return new LoginSession(
            -1,
            '',
            'group-token',
            $login
          );
        },
        'createOrUpdatePersonSession' => function(LoginSession $loginSession, string $code): PersonSession {
          return new PersonSession(
            $loginSession,
            new Person(-1, 'new_token', $code, $code)
          );
        },
        'getDependantSessions' => [
          new LoginSession(2, '', 'group-token',$loginTesteeA),
          new LoginSession(3, '', 'group-token',$loginTesteeB)
        ],
        'getGroupMonitors' => [
          new Group('sample_group', 'Sample Group')
        ],
        'getTestsOfPerson' => function(PersonSession $personSession): array {
          return array_map(
            function(string $bookletId): TestData {
              return new TestData(
                1,
                $bookletId,
                "label of $bookletId",
                "desc",
                false,
                true,
                (object) []
              );
            },
            $personSession->getLoginSession()->getLogin()->getBooklets()[$personSession->getPerson()->getCode() ?? '']
          );
        }
      ],
      [
        'getOrCreateLoginSession' => 1,
        'getOrCreatePersonSession' => 6, // 4 persons of loginTesteeA + 1 person of loginTesteeB + 1 monitor
        'getGroupMonitors' => 1,
        'getDependantSessions' => 1
      ]
    );

    $this->mockTestDAO(
      [
        'getTestByPerson' => null,
        'createTest' => function(int $personId, string $bookletId, string $bookletLabel): TestData {
          return new TestData(
            1,
            $bookletId,
            $bookletLabel,
            'desc',
            false,
            false,
            (object) []
          );
        },
      ],
      [
        'getTestByPerson' => 6,
        'createTest' => 6
      ]
    );

    $response = SessionController::putSessionLogin(
      RequestCreator::create('PUT', '/session/login', '{"name":"test", "password":"foo"}'),
      ResponseCreator::createEmpty()
    );

    $response->getBody()->rewind();

    $this->assertEquals(
      '{"token":"new_token","displayName":"Sample Group\/test-monitor","customTexts":{},"flags":[],"claims":{"test":[{"label":"label of THE_BOOKLET","id":"THE_BOOKLET","type":"test","flags":{"locked":false,"running":true}}],"testGroupMonitor":[{"label":"Sample Group","id":"sample_group","type":"testGroupMonitor","flags":[]}]},"groupToken":"group-token","access":{"test":["THE_BOOKLET"],"testGroupMonitor":["sample_group"]}}',
      $response->getBody()->getContents()
    );
    $this->assertEquals(200, $response->getStatusCode());
  }

  public function test_getSession_loginSession() {
    $loginSession = new LoginSession(
      1,
      'login_token',
      'group-token',
      new Login(
        'sample_user',
        'password_hash',
        'run-hot-return',
        'sample_group',
        'Sample Group',
        ['xxx' => ['THE_BOOKLET']],
        1
      ));

    $loginToken = new AuthToken('login_token', 1, 'login', 1, 'run-hot-return', 'sample_group');

    $this->mockSessionDAO([
      'getLoginSessionByToken' => $loginSession
    ]);

    $response = SessionController::getSession(
      RequestCreator::create('GET', '/session')->withAttribute('AuthToken', $loginToken),
      ResponseCreator::createEmpty()
    );

    $response->getBody()->rewind();

    $this->assertEquals(
      '{"token":"login_token","displayName":"Sample Group\/sample_user","customTexts":{},"flags":["codeRequired"],"claims":{},"groupToken":"group-token","access":{}}',
      $response->getBody()->getContents()
    );

  }

  public function test_getSession_personSession() {
    $personSession = new PersonSession(
      new LoginSession(
        1,
        'login_token',
        'group-token',
        new Login(
          'sample_user',
          'password_hash',
          'run-hot-return',
          'sample_group',
          'Sample Group',
          ['xxx' => ['THE_BOOKLET']],
          1
        )
      ),
      new Person(
        1,
        'person_token',
        'xxx',
        'xxx'
      )
    );

    $personToken = new AuthToken('person_token', 1, 'person', 1, 'run-hot-return', 'sample_group');

    $this->mockSessionDAO([
      'getPersonSessionByToken' => $personSession,
      'getTestsOfPerson' => [
        new TestData(
          1,
          'THE_BOOKLET',
          'Label of THE_BOOKLET',
          'Description',
          true,
          false,
          (object) []
        )
      ]
    ]);

    $this->mockWorkspaceDAO([
      'getWorkspaceName' => 'example_workspace'
    ]);

    $response = SessionController::getSession(
      RequestCreator::create('GET', '/session')->withAttribute('AuthToken', $personToken),
      ResponseCreator::createEmpty()
    );

    $response->getBody()->rewind();

    $this->assertEquals(
      '{"token":"person_token","displayName":"Sample Group\/sample_user\/xxx","customTexts":{},"flags":[],"claims":{"test":[{"label":"Label of THE_BOOKLET","id":"THE_BOOKLET","type":"test","flags":{"locked":true,"running":false}}]},"groupToken":"group-token","access":{"test":["THE_BOOKLET"]}}',
      $response->getBody()->getContents()
    );
  }

  public function test_getSession_monitor() {
    $personSession = new PersonSession(
      new LoginSession(
        2,
        'login_token',
        'group-token',
        new Login(
          'sample_monitor',
          'password_hash',
          'monitor-group',
          'sample_group',
          'Sample Group',
          ['' => ['THE_BOOKLET']],
          1
        )
      ),
      new Person(
        2,
        'monitor_token',
        '',
        ''
      )
    );

    $personToken = new AuthToken('monitor_token', 2, 'person', 1, 'monitor-group', 'sample_group');

    $this->mockSessionDAO([
      'getPersonSessionByToken' => $personSession,
      'getTestsOfPerson' => [
        new TestData(
          1,
          'THE_BOOKLET',
          'Label of THE_BOOKLET',
          'Description',
          true,
          false,
          (object) []
        )
      ],
      'getGroupMonitors' => [
        new Group('sample_group', 'Sample Group')
      ]
    ]);

    $this->mockWorkspaceDAO([
      'getWorkspaceName' => 'example_workspace'
    ]);

    $response = SessionController::getSession(
      RequestCreator::create('GET', '/session')->withAttribute('AuthToken', $personToken),
      ResponseCreator::createEmpty()
    );

    $response->getBody()->rewind();

    $this->assertEquals(
      '{"token":"monitor_token","displayName":"Sample Group\/sample_monitor","customTexts":{},"flags":[],"claims":{"test":[{"label":"Label of THE_BOOKLET","id":"THE_BOOKLET","type":"test","flags":{"locked":true,"running":false}}],"testGroupMonitor":[{"label":"Sample Group","id":"sample_group","type":"testGroupMonitor","flags":[]}]},"groupToken":"group-token","access":{"test":["THE_BOOKLET"],"testGroupMonitor":["sample_group"]}}',
      $response->getBody()->getContents()
    );
  }

  public function test_getSession_adminSession() {
    $adminToken = new AuthToken('admin_token', 1, 'admin', -1, 'admin', '[admins]');

//        $accessObject = new AccessSet('admin_token', 'Super', []);
//        $accessObject->addAccessObjects("workspaceAdmin", "1");

    $this->mockAdminDao([
      'refreshAdminToken' => function(): void {
      },
      'getAdmin' => new Admin(1, 'super', '', true, 'admin_token'),
      'getWorkspaces' => [new WorkspaceData(1, 'workspace', 'RW')]
    ]);

    $response = SessionController::getSession(
      RequestCreator::create('GET', '/session')->withAttribute('AuthToken', $adminToken),
      ResponseCreator::createEmpty()
    );

    $response->getBody()->rewind();

    $this->assertEquals(
      '{"token":"admin_token","displayName":"super","customTexts":{},"flags":[],"claims":{"workspaceAdmin":[{"label":"workspace","id":"1","type":"workspaceAdmin","flags":{"mode":"RW"}}],"superAdmin":[]},"groupToken":null,"access":{"workspaceAdmin":["1"],"superAdmin":[]}}',
      $response->getBody()->getContents()
    );
  }

  public function test_getSession_unknownTokenType() {
    $unknownToken = new AuthToken('whoever', 1, 'unknown', -1, 'whatever', 'whatever');

    $this->expectException(HttpUnauthorizedException::class);
    SessionController::getSession(
      RequestCreator::create('GET', '/session')->withAttribute('AuthToken', $unknownToken),
      ResponseCreator::createEmpty()
    );
  }
}