<?php /** @noinspection PhpUnhandledExceptionInspection */

declare(strict_types=1);

use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Response;


require_once "src/controller/Controller.class.php";
require_once "src/controller/SessionController.class.php";


class SessionControllerInjector extends SessionController {

    public static function injectSessionDAO(SessionDAO $sessionDao) {

        SessionController::$_sessionDAO = $sessionDao;
    }


    public static function injectTestDAO(TestDAO $testDAO) {

        SessionController::$_testDAO = $testDAO;
    }


    public static function injectAdminDAO(AdminDAO $adminDAO) {

        SessionController::$_adminDAO = $adminDAO;
    }

    public static function injectBookletsFolder(BookletsFolder $bookletsFolder, int $workspaceId) {

        self::$_bookletFolders[$workspaceId] = $bookletsFolder;
    }
}


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class SessionControllerTest extends TestCase {


    function setUp(): void {

        require_once "unit-tests/test-helper/RequestCreator.class.php";
        require_once "src/data-collection/DataCollectionTypeSafe.class.php";
        require_once "src/data-collection/Login.class.php";
        require_once "src/data-collection/LoginSession.class.php";
        require_once "src/data-collection/AccessSet.class.php";
        require_once "src/data-collection/PersonSession.class.php";
        require_once "src/data-collection/Person.class.php";
        require_once "src/data-collection/SessionChangeMessage.class.php";
        require_once "src/data-collection/AuthToken.class.php";
        require_once "src/controller/Controller.class.php";
        require_once "src/controller/SessionController.class.php";
        require_once "src/helper/RequestBodyParser.class.php";
        require_once "src/helper/JSON.class.php";
        require_once "src/helper/Password.class.php";
        require_once "src/helper/Mode.class.php";
        require_once "src/helper/TimeStamp.class.php";
        require_once "src/helper/BroadcastService.class.php";
        require_once "src/dao/DAO.class.php";
        require_once "src/dao/SessionDAO.class.php";
        require_once "src/dao/TestDAO.class.php";
        require_once "src/dao/AdminDAO.class.php";
        require_once "src/exception/HttpException.class.php";
        require_once "src/exception/HttpSpecializedException.class.php";
        require_once "src/exception/HttpBadRequestException.class.php";
        require_once "src/workspace/Workspace.class.php";
        require_once "src/workspace/BookletsFolder.class.php";
        require_once "src/exception/HttpUnauthorizedException.class.php";


        $mockBookletsFolder = $this->createMock('BookletsFolder');
        $mockBookletsFolder
            ->method('getBookletLabel')
            ->willReturn('A BOOKLET LABEL READ FROM FILE');

        SessionControllerInjector::injectBookletsFolder($mockBookletsFolder, 1);
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


    private function addMockFunctions(MockObject $mockObject, array $functionsAndResults, array $expectFunctionCalls = []) {

        foreach($functionsAndResults as $function => $result) {

            $method = $mockObject
                ->expects(isset($expectFunctionCalls[$function]) ? $this->exactly($expectFunctionCalls[$function]) : $this->any())
                ->method($function);

            if ($result instanceof Exception) {

                $method->willThrowException($result);

            } else if (is_callable($result)) {

                $method->willReturnCallback($result);

            } else  {

                $method->willReturn($result);
            }
        }
    }


    public function test_putSessionLogin_loginThatRequiresCode(): void { //!

        $this->mockSessionDAO([
            'getOrCreateLoginSession' => new LoginSession(
                1,
                'some_token',
                new Login(
                    'sample_user',
                    'password_hash',
                    'run-hot-return',
                    'sample_group',
                    'Sample Group',
                    ['aaa' => ['THE_BOOKLET']],
                    1
                )
            ),
            'renewPersonToken' => function(PersonSession $personSession): PersonSession {
                return $personSession->withNewToken('new_token');
            }
        ]);

        $response = SessionController::putSessionLogin(
            RequestCreator::create('PUT', '/session/login', '{"name":"test", "password":"user123"}'),
            new Response()
        );

        $response->getBody()->rewind();

        $this->assertEquals(
            '{"token":"some_token","displayName":"Sample Group\/sample_user","customTexts":{},"flags":["codeRequired"],"access":{}}',
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
            new Response()
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
            new Response()
        );
    }


    public function test_putSessionLogin_returnPersonSessionIfNoCodeRequired(): void {

        $loginSession = new LoginSession(
            1,
            'some_token',
            new Login(
                'sample_user',
                'password_hash',
                'run-hot-return',
                'sample_group',
                'Sample Group',
                [ '' => ['THE_BOOKLET']],
                1
            ));

        $this->mockSessionDAO([
            'getOrCreateLoginSession' => $loginSession,
            'getOrCreatePersonSession' => new PersonSession(
                $loginSession,
                new Person(1, 'person_token', '')
            ),
            'renewPersonToken' => function(PersonSession $personSession): PersonSession {
                return $personSession->withNewToken('new_token');
            }
        ]);

        $response = SessionController::putSessionLogin(
            RequestCreator::create('PUT', '/session/login', '{"name":"sample_user", "password":"foo"}'),
            new Response()
        );

        $response->getBody()->rewind();

        $this->assertEquals(
            '{"token":"new_token","displayName":"Sample Group\/sample_user\/","customTexts":{},"flags":[],"access":{"test":["THE_BOOKLET"]}}',
            $response->getBody()->getContents()
        );
        $this->assertEquals(200, $response->getStatusCode());
    }


    public function test_putSessionLogin_registerGroupIfMonitor(): void {

        $loginSessionMonitor = new LoginSession(
            1,
            'some_token',
            new Login(
                'test-monitor',
                'password_hash',
                'monitor-group',
                'sample_group',
                'Sample Group',
                [ '' => ['THE_BOOKLET']],
                1
            )
        );

        $loginTesteeA = new Login(
            'test',
            'password_hash',
            'run-hot-return',
            'sample_group',
            'Sample Group',
            [ 'aaa' => ['THE_BOOKLET'], 'yyy' => ['THE_BOOKLET'], 'zzz' => ['THE_BOOKLET'], 'xxx' => ['THE_BOOKLET']],
            1
        );

        $loginTesteeB = new Login(
            'testeeB',
            'password_hash',
            'run-hot-return',
            'sample_group',
            'Sample Group',
            [ '' => ['THE_BOOKLET', 'THE_OTHER_BOOKLET']],
            1
        );


        $this->mockSessionDAO(
            [
                'getOrCreateLoginSession' => $loginSessionMonitor,
                'createLoginSession' => function (Login $login): LoginSession {
                    return new LoginSession(
                        -1,
                        '',
                        $login
                    );
                },
                'getOrCreatePersonSession' => function(LoginSession $loginSession, string $code): PersonSession {
                    return new PersonSession(
                        $loginSession,
                        new Person(-1, 'person_token', $code)
                    );
                },
                'getLoginsByGroup' => [
                    new LoginSession(2, '', $loginTesteeA),
                    new LoginSession(3, '', $loginTesteeB)
                ],
                'renewPersonToken' => function(PersonSession $personSession): PersonSession {
                    return $personSession->withNewToken('new_token');
                }
            ],
            [
                'getOrCreateLoginSession' => 1,
                'getOrCreatePersonSession' => 6, // 4 persons of loginTesteeA + 1 person of loginTesteeB + 1 monitor
                'getLoginsByGroup' => 1, // 1
            ]
        );

        $this->mockTestDAO(
            [
                'getOrCreateTest' => ['id' => -1],
            ],
            [
                'getOrCreateTest' => 6 // 4 of loginTesteeA + 2 of loginTesteeB
            ]
        );

        $response = SessionController::putSessionLogin(
            RequestCreator::create('PUT', '/session/login', '{"name":"test", "password":"foo"}'),
            new Response()
        );

        $response->getBody()->rewind();

        $this->assertEquals(
            '{"token":"new_token","displayName":"Sample Group\/test-monitor\/","customTexts":{},"flags":[],"access":{"testGroupMonitor":["sample_group"],"test":["THE_BOOKLET"]}}',
            $response->getBody()->getContents()
        );
        $this->assertEquals(200, $response->getStatusCode());
    }


    public function test_getSession_loginSession() {

        $loginSession = new LoginSession(
            1,
            'login_token',
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
            new Response()
        );

        $response->getBody()->rewind();

        $this->assertEquals(
            '{"token":"login_token","displayName":"Sample Group\/sample_user","customTexts":{},"flags":["codeRequired"],"access":{}}',
            $response->getBody()->getContents()
        );

    }

    public function test_getSession_personSession() {

        $personSession = new PersonSession(
            new LoginSession(
                1,
                'login_token',
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
                'xxx'
            )
        );

        $personToken = new AuthToken('person_token', 1, 'person', 1, 'run-hot-return', 'sample_group');

        $this->mockSessionDAO([
            'getPersonSessionByToken' => $personSession
        ]);

        $response = SessionController::getSession(
            RequestCreator::create('GET', '/session')->withAttribute('AuthToken', $personToken),
            new Response()
        );

        $response->getBody()->rewind();

        $this->assertEquals(
            '{"token":"person_token","displayName":"Sample Group\/sample_user\/xxx","customTexts":{},"flags":[],"access":{"test":["THE_BOOKLET"]}}',
            $response->getBody()->getContents()
        );
    }


    public function test_getSession_monitor() {

        $personSession = new PersonSession(
            new LoginSession(
                2,
                'login_token',
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
                ''
            )
        );

        $personToken = new AuthToken('monitor_token', 2, 'person', 1, 'monitor-group', 'sample_group');

        $this->mockSessionDAO([
            'getPersonSessionByToken' => $personSession
        ]);

        $response = SessionController::getSession(
            RequestCreator::create('GET', '/session')->withAttribute('AuthToken', $personToken),
            new Response()
        );

        $response->getBody()->rewind();

        $this->assertEquals(
            '{"token":"monitor_token","displayName":"Sample Group\/sample_monitor\/","customTexts":{},"flags":[],"access":{"testGroupMonitor":["sample_group"],"test":["THE_BOOKLET"]}}',
            $response->getBody()->getContents()
        );
    }


    public function test_getSession_adminSession() {

        $adminToken = new AuthToken('admin_token', 1, 'admin', -1, 'admin', '[admins]');

        $accessObject = new AccessSet('admin_token', 'Super', []);
        $accessObject->addAccessObjects("workspaceAdmin", "1");

        $this->mockAdminDao([
            'getAdminAccessSet' => $accessObject,
            'refreshAdminToken' => function(): void {}
        ]);

        $response = SessionController::getSession(
            RequestCreator::create('GET', '/session')->withAttribute('AuthToken', $adminToken),
            new Response()
        );

        $response->getBody()->rewind();

        $this->assertEquals(
            '{"token":"admin_token","displayName":"Super","customTexts":{},"flags":[],"access":{"workspaceAdmin":["1"]}}',
            $response->getBody()->getContents()
        );
    }


    public function test_getSession_unknownTokenType() {

        $unknownToken = new AuthToken('whoever', 1, 'unknown', -1, 'whatever', 'whatever');

        $this->expectException(HttpUnauthorizedException::class);
        SessionController::getSession(
            RequestCreator::create('GET', '/session')->withAttribute('AuthToken', $unknownToken),
            new Response()
        );
    }
}