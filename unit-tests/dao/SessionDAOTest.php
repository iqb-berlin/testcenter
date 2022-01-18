<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class SessionDAOTest extends TestCase {

    private SessionDAO $dbc;

    private $testLoginSession;

    static function setUpBeforeClass(): void {

        require_once "classes/exception/HttpError.class.php";
        require_once "classes/data-collection/DataCollection.class.php";
        require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
        require_once "classes/helper/DB.class.php";
        require_once "classes/helper/JSON.class.php";
        require_once "classes/data-collection/DBConfig.class.php";
        require_once "classes/data-collection/Login.class.php";
        require_once "classes/data-collection/LoginSession.class.php";
        require_once "classes/data-collection/Session.class.php";
        require_once "classes/data-collection/Person.class.php";
        require_once "classes/data-collection/PersonSession.class.php";
        require_once "classes/helper/TimeStamp.class.php";
        require_once "classes/dao/DAO.class.php";
        require_once "classes/dao/SessionDAO.class.php";
    }

    function setUp(): void {

        DB::connect(new DBConfig(["type" => "temp", "staticTokens" => true]));
        $this->dbc = new SessionDAO();
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql');
        $this->dbc->runFile('unit-tests/testdata.sql');

        $this->testLoginSession = new LoginSession(
            1,
            "login_session_token",
            new Login(
                "some_user",
                "some_pass_hash",
                "run_hot_return",
                "a group name",
                "A Group Label",
                ["existing_code" => ["a booklet"]],
                1,
                TimeStamp::fromXMLFormat('1/1/2030 12:00')
            )
        );
    }


    function tearDown(): void {

        unset($this->dbc);
    }


    function test_getLoginSessionByToken_success() {

        $result = $this->dbc->getLoginSessionByToken('nice_token');
        $expected = new LoginSession(
            1,
            'nice_token',
            new Login(
                'test',
                'pw_hash',
                'run-hot-return',
                'sample_group',
                'Sample Group',
                ['xxx' => [0 => 'BOOKLET.SAMPLE-1']],
                1,
                1893574800,
                0,
                0,
                (object)[]
            )
        );

        $this->assertEquals($result, $expected);
    }


    function test_getLoginSessionByToken_expired() {

        $this->expectException('HttpError');
        $this->dbc->getLoginSessionByToken('expired_token');
    }



    function test_getLoginSessionByToken_future() {

        $this->expectException('HttpError');
        $this->dbc->getLoginSessionByToken('future_token');
    }


    function test_getLoginSessionByToken_falseToken() {

        $this->expectException('HttpError');
        $this->dbc->getLoginSessionByToken('not_existing_token');
    }


    function test_getLoginSessionByToken_deletedLogin() {

        $this->expectException('HttpError');
        $this->dbc->getLoginSessionByToken('deleted_login_token');
    }


    function test_createPersonSession_correctCode() {

        $result = $this->dbc->createPersonSession($this->testLoginSession, 'existing_code');

        $this->assertEquals(5, $result->getId());
        $this->assertEquals('static:person:a group name_some_user_existing_code', $result->getToken());
        $this->assertEquals('existing_code', $result->getCode());
        $this->assertEquals(1893495600, $result->getValidTo() );
    }


    function test_createPersonSession_wrongCode() {

        $this->expectException("HttpError");
        $this->dbc->createPersonSession($this->testLoginSession, 'wrong_code');
    }


    function test_createPersonSession_expiredLogin() {

        $testLoginSession = new LoginSession(
            1,
            "login_session_token",
            new Login(
                "some_user",
                "some_pass_hash",
                "run_hot_return",
                "a group name",
                "A Group Label",
                ["existing_code" => ["a booklet"]],
                1,
                TimeStamp::fromXMLFormat('1/1/2020 12:00')
            )
        );

        $this->expectException("HttpError");
        $this->dbc->createPersonSession($testLoginSession, 'existing_code');
    }


    function test_createPersonSession_futureLogin() {

        $testLoginSession = new LoginSession(
            1,
            "login_session_token",
            new Login(
                "some_user",
                "some_pass_hash",
                "run_hot_return",
                "a group name",
                "A Group Label",
                ["existing_code" => ["a booklet"]],
                1,
                TimeStamp::fromXMLFormat('1/1/2040 12:00'),
                TimeStamp::fromXMLFormat('1/1/2030 12:00')
            )
        );

        $this->expectException("HttpError");
        $this->dbc->createPersonSession($testLoginSession, 'existing_code');
    }


    function test_createPersonSession_withValidFor() {

        TimeStamp::setup('Europe/Berlin', '1/1/2020 12:00');
        $testLoginSession = new LoginSession(
            1,
            "login_session_token",
            new Login(
                "some_user",
                "some_pass_hash",
                "run_hot_return",
                "a group name",
                "A Group Label",
                ["existing_code" => ["a booklet"]],
                1,
                TimeStamp::fromXMLFormat('1/1/2030 12:00'),
                TimeStamp::fromXMLFormat('1/1/2010 12:00'),
                10
            )
        );

        $result = $this->dbc->createPersonSession($testLoginSession, 'existing_code');

        $this->assertEquals(5, $result->getId());
        $this->assertEquals('static:person:a group name_some_user_existing_code', $result->getToken());
        $this->assertEquals('existing_code', $result->getCode());
        $this->assertEquals(1577877000, $result->getValidTo() ); // 1577877000 = 1/1/2020 12:10 GMT+1
    }



    function test_getPersonSessionFromToken_correctToken() {

        $result = $this->dbc->getPersonSessionFromToken('person-token');
        $expectation = new PersonSession(
            new LoginSession(
                4,
                'test_token',
                new Login(
                    'sample_user',
                    'pw_hash',
                    'run-hot-return',
                    'sample_group',
                    'Sample Group',
                    ["xxx" => ["BOOKLET.SAMPLE-1"]],
                    1,
                    1893574800,
                    0,
                    0,
                    (object) []
                )
            ),
            new Person(
                1,
                'person-token',
                'xxx',
                1893574800
            )
        );
        $this->assertEquals($expectation, $result);
    }


    function test_getPersonSessionFromToken_wrongToken() {

        $this->expectException('HttpError');
        $this->dbc->getPersonSessionFromToken('wrong-token');
    }


    function test_getPersonSessionFromToken_expiredLogin() {

        $this->expectException('HttpError');
        $this->dbc->getPersonSessionFromToken('person-of-expired-login-token');
    }


    function test_getPersonSessionFromToken_futureLogin() {

        $this->expectException('HttpError');
        $g = $this->dbc->getPersonSessionFromToken('person-of-future-login-token');
        print_r($g);
    }


    function test_getPersonSessionFromToken_expired() {

        $this->expectException('HttpError');
        $this->dbc->getPersonSessionFromToken('expired-person-token');
    }
}
