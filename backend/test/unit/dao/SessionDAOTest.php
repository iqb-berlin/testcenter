<?php /** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class SessionDAOTest extends TestCase {

    private SessionDAO $dbc;

    private LoginSession $testLoginSession;
    private array $testDataLoginSessions;
    private PersonSession $testPersonSession;

    static function setUpBeforeClass(): void {

        require_once "test/unit/mock-classes/PasswordMock.php";

        require_once "src/exception/HttpError.class.php";
        require_once "src/data-collection/DataCollection.class.php";
        require_once "src/data-collection/DataCollectionTypeSafe.class.php";
        require_once "src/data-collection/AuthToken.class.php";
        require_once "src/helper/DB.class.php";
        require_once "src/helper/JSON.class.php";
        require_once "src/data-collection/DBConfig.class.php";
        require_once "src/data-collection/Login.class.php";
        require_once "src/data-collection/LoginSession.class.php";
        require_once "src/data-collection/AccessSet.class.php";
        require_once "src/data-collection/Person.class.php";
        require_once "src/data-collection/PersonSession.class.php";
        require_once "src/helper/TimeStamp.class.php";
        require_once "src/dao/DAO.class.php";
        require_once "src/dao/SessionDAO.class.php";
    }

    function setUp(): void {

        DB::connect(new DBConfig(["type" => "temp", "staticTokens" => true]));
        $this->dbc = new SessionDAO();
        $this->dbc->runFile(REAL_ROOT_DIR . '/database/sqlite.sql');
        $this->dbc->runFile(REAL_ROOT_DIR . '/backend/test/unit/testdata.sql');

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

        $this->testDataLoginSessions = [
            new LoginSession(
                1,
                "nice_token",
                new Login(
                    "test",
                    "",
                    "run-hot-return",
                    "sample_group",
                    "Sample Group",
                    ["xxx" => ["BOOKLET.SAMPLE-1"]],
                    1,
                    1893574800,
                    0,
                    0,
                    new stdClass(),
                )
            ),
            new LoginSession(
                2,
                "expired_token",
                new Login(
                    "test-expired",
                    "",
                    "run-hot-return",
                    "sample_group",
                    "Sample Group",
                    ["xxx" => ["BOOKLET.SAMPLE-1"]],
                    1,
                    946803600,
                    0,
                    0,
                    new stdClass()
                )
            ),
            new LoginSession(
                3,
                "monitor_token",
                new Login(
                    "monitor",
                    "",
                    "monitor-group",
                    "sample_group",
                    "Sample Group",
                    ["xxx" => ["BOOKLET.SAMPLE-1"]],
                    1,
                    1893574800,
                    0,
                    0,
                    new stdClass(),
                )
            ),
            new LoginSession(
                4,
                "test_token",
                new Login(
                    "sample_user",
                    "",
                    "run-hot-return",
                    "sample_group",
                    "Sample Group",
                    ["xxx" => ["BOOKLET.SAMPLE-1"]],
                    1,
                    1893574800,
                    0,
                    0,
                    new stdClass()
                )
            ),
            new LoginSession(
                5,
                "future_token",
                new Login(
                    "future_user",
                    "",
                    "run-hot-return",
                    "sample_group",
                    "Sample Group",
                    [],
                    1,
                    2209107600,
                    1893574800,
                    0,
                    new stdClass()
                )
            )
        ];

        $this->testPersonSession = new PersonSession(
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
                'xxx',
                1893574800
            )
        );
    }


    function tearDown(): void {

        unset($this->dbc);
    }


    function test_getToken_admin() {

        $expectation = new AuthToken(
            "admin_token",
            1,
            'admin',
            -1,
            'super-admin',
            '[admins]'
        );
        $result = $this->dbc->getToken('admin_token', ['admin']);
        $this->assertEquals($expectation, $result);
    }


    function test_getToken_person() {

        $expectation = new AuthToken(
            "person-token",
            1,
            'person',
            1,
            'run-hot-return',
            'sample_group'
        );
        $result = $this->dbc->getToken('person-token', ['person']);
        $this->assertEquals($expectation, $result);
    }


    function test_getToken_login() {

        $expectation = new AuthToken(
            "nice_token",
            1,
            'login',
            1,
            'run-hot-return',
            'sample_group'
        );
        $result = $this->dbc->getToken('nice_token', ['login']);
        $this->assertEquals($expectation, $result);
    }


    function test_getToken_wrongToken() {

        $this->expectException(HttpError::class);
        $this->dbc->getToken('not-existing', ['admin']);
    }


    function test_getToken_wrongTokenType() {

        $this->expectException(HttpError::class);
        $this->dbc->getToken('person-token', ['admin']);
    }


    function test_getToken_Expired() {

        $this->expectException(HttpError::class);
        $this->dbc->getToken('person-of-expired-login-token', ['person']);
    }


    function test_getLoginSessionByToken_success() {

        $result = $this->dbc->getLoginSessionByToken('nice_token');
        $expected = new LoginSession(
            1,
            'nice_token',
            new Login(
                'test',
                '',
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


    function test_getPersonSession_correctCode() {

        $result = $this->dbc->getPersonSession($this->testDataLoginSessions[3], 'xxx');

        $this->assertSame(1, $result->getPerson()->getId());
        $this->assertSame('person-token', $result->getPerson()->getToken());
        $this->assertSame('xxx', $result->getPerson()->getCode());
        $this->assertSame(1893574800, $result->getPerson()->getValidTo());
        $this->assertEquals($this->testDataLoginSessions[3], $result->getLoginSession());
    }


    function test_getLoginSessionByToken_wrongCode() {

        $result = $this->dbc->getPersonSession($this->testDataLoginSessions[3], 'not_existing');
        $this->assertNull($result);
    }


    function test_getLoginSessionByToken_notExistingLoginSession() {

        $result = $this->dbc->getPersonSession($this->testLoginSession, 'existing_code');
        $this->assertNull($result);
    }


    function test_createPersonSession_correctCode() {

        $result = $this->dbc->createPersonSession($this->testLoginSession, 'existing_code', 0);

        $this->assertEquals(5, $result->getPerson()->getId());
        $this->assertEquals('static:person:a group name_some_user_existing_code', $result->getPerson()->getToken());
        $this->assertEquals('existing_code', $result->getPerson()->getCode());
        $this->assertEquals(1893495600, $result->getPerson()->getValidTo());
        $this->assertEquals(5, $this->countTableRows('person_sessions'));
    }


    function test_createPersonSession_wrongCode() {

        $this->expectException("HttpError");
        $this->dbc->createPersonSession($this->testLoginSession, 'wrong_code',0);
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
        $this->dbc->createPersonSession($testLoginSession, 'existing_code', 0);
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
        $this->dbc->createPersonSession($testLoginSession, 'existing_code', 0);
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

        $result = $this->dbc->createPersonSession($testLoginSession, 'existing_code', 0);

        $this->assertEquals(5, $result->getPerson()->getId());
        $this->assertEquals('static:person:a group name_some_user_existing_code', $result->getPerson()->getToken());
        $this->assertEquals('existing_code', $result->getPerson()->getCode());
        $this->assertEquals(1577877000, $result->getPerson()->getValidTo() ); // 1577877000 = 1/1/2020 12:10 GMT+1
        $this->assertEquals($testLoginSession, $result->getLoginSession());
        $this->assertEquals(5, $this->countTableRows('person_sessions'));
    }


    function test_getPersonSession_restart() {

        $result1 = $this->dbc->createPersonSession($this->testLoginSession, 'existing_code', 1);
        $result2 = $this->dbc->createPersonSession($this->testLoginSession, 'existing_code', 2);
        $this->assertEquals(5, $result1->getPerson()->getId());
        $this->assertEquals('existing_code/1', $result1->getPerson()->getNameSuffix());
        $this->assertEquals(6, $result2->getPerson()->getId());
        $this->assertEquals('existing_code/2', $result2->getPerson()->getNameSuffix());
        $this->assertEquals(6, $this->countTableRows('person_sessions'));
    }


    function test_getPersonSessionByToken_correctToken() {

        $result = $this->dbc->getPersonSessionByToken('person-token');
        $this->assertEquals($this->testPersonSession, $result);
    }


    function test_getPersonSessionByToken_wrongToken() {

        $this->expectException('HttpError');
        $this->dbc->getPersonSessionByToken('wrong-token');
    }


    function test_getPersonSessionByToken_expiredLogin() {

        $this->expectException('HttpError');
        $this->dbc->getPersonSessionByToken('person-of-expired-login-token');
    }


    function test_getPersonSessionByToken_futureLogin() {

        $this->expectException('HttpError');
        $this->dbc->getPersonSessionByToken('person-of-future-login-token');
    }


    function test_getPersonSessionByToken_expired() {

        $this->expectException('HttpError');
        $this->dbc->getPersonSessionByToken('expired-person-token');
    }


    function test_getLoginsByGroup() {


        $result = $this->dbc->getLoginsByGroup('sample_group', 1);

        $this->assertEquals($this->testDataLoginSessions, $result);
    }


    function test_getLoginsByGroup_notExistingGroup() {

        $result = $this->dbc->getLoginsByGroup('notExistingGroup', 1);

        $this->assertEquals([], $result);
    }


    function test_createLoginSession() {

        $anotherLogin = new Login(
            "another_one",
            "blablaa",
            "hot-run-restart",
            "another_group",
            "Another Group",
            [ '' => 'A.BOOKLET' ],
            1,
            946803600
        );

        $expectation = new LoginSession(
            7,
            'static:login:another_one',
            $anotherLogin
        );

        $result = $this->dbc->createLoginSession($anotherLogin, true);

        $this->assertEquals($expectation, $result);
        $this->assertEquals(7, $this->countTableRows('login_sessions'));


        $this->expectException(HttpError::class);
        $this->dbc->createLoginSession($anotherLogin, false);
    }


    public function test_getLoginSession_okay(): void {

        $result = $this->dbc->getLoginSession("test", "pw_hash");
        $this->assertEquals($this->testDataLoginSessions[0], $result);
    }


    public function test_getLoginSession_expired(): void {

        $this->expectException(HttpError::class);
        $this->dbc->getLoginSession("test-expired", "pw_hash");
    }


    public function test_getLoginSession_wrongPassword(): void {

        $loginSession = $this->dbc->getLoginSession("test", "wrong");
        $this->assertNull($loginSession);
    }


    public function test_getLoginSession_missingPassword(): void {

        $loginSession = $this->dbc->getLoginSession("test", "");
        $this->assertNull($loginSession);
    }


    public function test_getLoginSession_futureUser(): void {

        $this->expectException(HttpError::class);
        $this->dbc->getLoginSession("future_user", "pw_hash");
    }


    public function test_getTestStatus(): void {

        $expectation = [
            'running' => true,
            'locked' => false,
            'label' => 'Sample Booklet Label'
        ];
        $result = $this->dbc->getTestStatus('person-token', 'BOOKLET.SAMPLE-1');
        $this->assertEquals($expectation, $result);


        $expectation = [
            'running' => false,
            'locked' => false,
            'label' => "Booklet without test"
        ];
        $result = $this->dbc->getTestStatus('person-token', 'BOOKLET.NO.TEST');
        $this->assertEquals($expectation, $result);
    }


    public function test_getTestStatus_missingTest(): void {

        $this->expectException(HttpError::class);
        $this->dbc->getTestStatus('person-token', 'first sample test');
    }


    public function test_personHasBooklet(): void {

        $result = $this->dbc->personHasBooklet('person-token', 'BOOKLET.SAMPLE-1');
        $this->assertTrue($result);

        $result = $this->dbc->personHasBooklet('person-of-future-login-token', 'BOOKLET.SAMPLE-1');
        $this->assertFalse($result);
    }


    public function test_renewPersonToken(): void {

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
                'static:person:sample_group_sample_user_xxx',
                'xxx',
                'xxx',
                1893574800
            )
        );

        $result = $this->dbc->renewPersonToken($this->testPersonSession);
        $this->assertEquals($expectation, $result);
    }


    public function test_ownsTest() {

        $result = $this->dbc->ownsTest('person-token', "1");
        $this->assertTrue($result);

        $result = $this->dbc->ownsTest('person-of-future-login-token', "1");
        $this->assertFalse($result);
    }


    private function countTableRows(string $tableName): int {

        return (int) $this->dbc->_("select count(*) as c from $tableName")["c"];
    }
}
