<?php /** @noinspection PhpUnhandledExceptionInspection */

declare(strict_types=1);

use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\MockObject\Rule\InvokedCount;
use PHPUnit\Framework\TestCase;
use Slim\Http\Environment;
use Slim\Http\Headers;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\Stream;
use Slim\Http\Uri;

require_once "classes/controller/Controller.class.php";
require_once "classes/controller/SessionController.class.php";
require_once "classes/dao/DAO.class.php";
require_once "classes/dao/SessionDAO.class.php";

class SessionControllerInjector extends SessionController {

    public static function injectSessionDAO(SessionDAO $sessionDao) {

        SessionController::$_sessionDAO = $sessionDao;
    }


    public static function injectTestDAO(TestDAO $testDAO) {

        SessionController::$_testDAO = $testDAO;
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

        require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
        require_once "classes/data-collection/Login.class.php";
        require_once "classes/data-collection/LoginSession.class.php";
        require_once "classes/data-collection/Session.class.php";
        require_once "classes/data-collection/PersonSession.class.php";
        require_once "classes/data-collection/Person.class.php";
        require_once "classes/data-collection/SessionChangeMessage.class.php";
        require_once "classes/controller/Controller.class.php";
        require_once "classes/controller/SessionController.class.php";
        require_once "classes/helper/RequestBodyParser.class.php";
        require_once "classes/helper/JSON.class.php";
        require_once "classes/helper/Password.class.php";
        require_once "classes/helper/Mode.class.php";
        require_once "classes/helper/TimeStamp.class.php";
        require_once "classes/helper/BroadcastService.class.php";
        require_once "classes/dao/DAO.class.php";
        require_once "classes/dao/SessionDAO.class.php";
        require_once "classes/dao/TestDAO.class.php";
        require_once "classes/exception/HttpException.class.php";
        require_once "classes/exception/HttpSpecializedException.class.php";
        require_once "classes/exception/HttpBadRequestException.class.php";
        require_once "classes/workspace/Workspace.class.php";
        require_once "classes/workspace/BookletsFolder.class.php";


        $mockBookletsFolder = $this->createMock('BookletsFolder');
        $mockBookletsFolder
            ->method('getBookletLabel')
            ->willReturn('A BOOKLET LABEL READ FROM FILE');

        SessionControllerInjector::injectBookletsFolder($mockBookletsFolder, 1);
    }


    private static function createRequest(
        string $method,
        string $uri,
        string $body = '',
        array $environment = [],
        array $cookies = [],
        array $serverParams = []
    ) {
        return new Request(
            $method,
            Uri::createFromString($uri),
            Headers::createFromEnvironment(Environment::mock($environment)),
            $cookies,
            $serverParams,
            new Stream(fopen(sprintf('data://text/plain,%s', $body), 'r'))
        );
    }


    private function mockSessionDAO(array $functionsAndResults, array $expectFunctionCalls = []): MockObject {

        $daoStub = $this->createMock('SessionDAO');
        $this->addMockFunctions($daoStub, $functionsAndResults, $expectFunctionCalls);
        SessionControllerInjector::injectSessionDAO($daoStub);
        return $daoStub;
    }


    private function mockTestDAO(array $functionsAndResults, array $expectFunctionCalls = []): MockObject {

        $daoStub = $this->createMock('TestDAO');
        $this->addMockFunctions($daoStub, $functionsAndResults, $expectFunctionCalls);
        SessionControllerInjector::injectTestDAO($daoStub);
        return $daoStub;
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


    public function test_putSessionLogin_loginThatRequiresCode(): void {

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
            )
        ]);

        $response = SessionController::putSessionLogin(
            SessionControllerTest::createRequest('PUT', '/session/login', '{"name":"test", "password":"user123"}'),
            new Response()
        );

        $response->getBody()->rewind();

        $this->assertEquals(
            '{"token":"some_token","displayName":"sample_group\/sample_user","customTexts":{},"flags":["codeRequired"],"access":{}}',
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
            SessionControllerTest::createRequest('PUT', '/session/login', '{"name":"test", "password":"foo"}'),
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
            SessionControllerTest::createRequest('PUT', '/session/login', '{"name":"test", "password":"foo"}'),
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
            )
        ]);

        $response = SessionController::putSessionLogin(
            SessionControllerTest::createRequest('PUT', '/session/login', '{"name":"sample_user", "password":"foo"}'),
            new Response()
        );

        $response->getBody()->rewind();

        $this->assertEquals(
            '{"token":"person_token","displayName":"Sample Group\/sample_user\/","customTexts":{},"flags":[],"access":{"test":["THE_BOOKLET"]}}',
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
                ]
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
            SessionControllerTest::createRequest('PUT', '/session/login', '{"name":"test", "password":"foo"}'),
            new Response()
        );

        $response->getBody()->rewind();

        $this->assertEquals(
            '{"token":"person_token","displayName":"Sample Group\/test-monitor\/","customTexts":{},"flags":[],"access":{"testGroupMonitor":["sample_group"],"test":["THE_BOOKLET"]}}',
            $response->getBody()->getContents()
        );
        $this->assertEquals(200, $response->getStatusCode());
    }
}