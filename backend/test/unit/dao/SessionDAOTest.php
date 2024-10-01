<?php /** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class SessionDAOExposed extends SessionDAO {
  public function getLoginSessions(array $filters = []): array {
    return parent::getLoginSessions($filters);
  }
}


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class SessionDAOTest extends TestCase {
  private SessionDAOExposed $dbc;
  private LoginSession $testLoginSession;
  private array $testDataLoginSessions;
  private PersonSession $testPersonSession;

  static function setUpBeforeClass(): void {
    require_once "test/unit/mock-classes/PasswordMock.php";
    require_once "test/unit/TestDB.class.php";
  }

  function setUp(): void {
    TestDB::setUp();
    TestEnvironment::makeRandomStatic();
    $this->dbc = new SessionDAOExposed();
    $this->dbc->runFile(ROOT_DIR . '/backend/test/unit/testdata.sql');

    $this->testLoginSession = new LoginSession(
      1,
      "login_session_token",
      "group-token",
      new Login(
        "some_user",
        "some_pass_hash",
        "run-hot-restart",
        "sample_group",
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
        "group-token",
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
        "group-token",
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
        "group-token",
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
        "group-token",
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
        "group-token",
        new Login(
          "future_user",
          "",
          "run-hot-return",
          "sample_group",
          "Sample Group",
          [],
          1,
          1956646800,
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
        "group-token",
        new Login(
          'sample_user',
          '',
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
      "group-token",
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
        (object) []
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
    $result = $this->dbc->createOrUpdatePersonSession($this->testDataLoginSessions[3], 'xxx');
    $this->assertSame(1, $result->getPerson()->getId());
    $this->assertSame(
      'static:person:sample_group_sample_user_xxx',
      $result->getPerson()->getToken(),
      'token got updated'
    );
    $this->assertSame('xxx', $result->getPerson()->getCode());
    $this->assertSame(1893574800, $result->getPerson()->getValidTo());
    $this->assertEquals($this->testDataLoginSessions[3], $result->getLoginSession());
  }

  function test_getLoginSessionByToken_wrongCode() {
    $this->expectException('HttpError');
    $this->dbc->createOrUpdatePersonSession($this->testDataLoginSessions[3], 'not_existing');
  }

  function test_createOrUpdatePersonSession_correctCode() {
    $result = $this->dbc->createOrUpdatePersonSession($this->testLoginSession, 'existing_code');

    $this->assertEquals(6, $result->getPerson()->getId());
    $this->assertEquals('static:person:sample_group_some_user_existing_code', $result->getPerson()->getToken());
    $this->assertEquals('existing_code', $result->getPerson()->getCode());
    $this->assertEquals(1893495600, $result->getPerson()->getValidTo());
    $this->assertEquals(6, $this->countTableRows('person_sessions'));
  }

  function test_createOrUpdatePersonSession_wrongCode() {
    $this->expectException("HttpError");
    $this->dbc->createOrUpdatePersonSession($this->testLoginSession, 'wrong_code');
  }

  function test_createOrUpdatePersonSession_expiredLogin() {
    $testLoginSession = new LoginSession(
      1,
      "login_session_token",
      "group-token",
      new Login(
        "some_user",
        "some_pass_hash",
        "run_hot_return",
        "sample_group",
        "A Group Label",
        ["existing_code" => ["a booklet"]],
        1,
        TimeStamp::fromXMLFormat('1/1/2020 12:00')
      )
    );

    $this->expectException("HttpError");
    $this->dbc->createOrUpdatePersonSession($testLoginSession, 'existing_code');
  }

  function test_createOrUpdatePersonSession_futureLogin() {
    $testLoginSession = new LoginSession(
      1,
      "login_session_token",
      "group-token",
      new Login(
        "some_user",
        "some_pass_hash",
        "run_hot_return",
        "sample_group",
        "A Group Label",
        ["existing_code" => ["a booklet"]],
        1,
        TimeStamp::fromXMLFormat('1/1/2032 12:00'),
        TimeStamp::fromXMLFormat('1/1/2030 12:00')
      )
    );

    $this->expectException("HttpError");
    $this->dbc->createOrUpdatePersonSession($testLoginSession, 'existing_code');
  }

  function test_createOrUpdatePersonSession_withValidFor() {
    SystemConfig::$debug_useStaticTime = '1/1/2020 12:00';
    $testLoginSession = new LoginSession(
      1,
      "login_session_token",
      "group-token",
      new Login(
        "some_user",
        "some_pass_hash",
        "run_hot_return",
        "sample_group",
        "A Group Label",
        ["existing_code" => ["a booklet"]],
        1,
        TimeStamp::fromXMLFormat('1/1/2030 12:00'),
        TimeStamp::fromXMLFormat('1/1/2010 12:00'),
        10
      )
    );

    $result = $this->dbc->createOrUpdatePersonSession($testLoginSession, 'existing_code');

    $this->assertEquals(6, $result->getPerson()->getId());
    $this->assertEquals('static:person:sample_group_some_user_existing_code', $result->getPerson()->getToken());
    $this->assertEquals('existing_code', $result->getPerson()->getCode());
    $this->assertEquals(1577877000, $result->getPerson()->getValidTo()); // 1577877000 = 1/1/2020 12:10 GMT+1
    $this->assertEquals($testLoginSession, $result->getLoginSession());
    $this->assertEquals(6, $this->countTableRows('person_sessions'));
  }

  function test_createOrUpdatePersonSession_restart() {
    $result1 = $this->dbc->createOrUpdatePersonSession($this->testLoginSession, 'existing_code');
    $result2 = $this->dbc->createOrUpdatePersonSession($this->testLoginSession, 'existing_code');
    $this->assertEquals(6, $result1->getPerson()->getId());
    $this->assertEquals('existing_code/h5ki-bd-', $result1->getPerson()->getNameSuffix());
    $this->assertEquals(7, $result2->getPerson()->getId());
    $this->assertEquals('existing_code/va4dg-jc', $result2->getPerson()->getNameSuffix());
    $this->assertEquals(7, $this->countTableRows('person_sessions'));
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

  function test_getLoginSessions_group() {
    $result = $this->dbc->getLoginSessions([
      'logins.group_name' => 'sample_group',
      'logins.workspace_id' => 1
    ]);

    $this->assertEquals($this->testDataLoginSessions, $result);
  }

  function test_getLoginSessions_notExistingGroup() {
    $result = $this->dbc->getLoginSessions([
      'logins.group_name' => 'notExistingGroup',
      'logins.workspace_id' => 1
    ]);

    $this->assertEquals([], $result);
  }

  function test_createLoginSession() {
    $anotherLogin = new Login(
      "another_one",
      "blablaa",
      "hot-run-restart",
      "sample_group",
      "Sample Group",
      ['' => 'A.BOOKLET'],
      1,
      946803600
    );

    $expectation = new LoginSession(
      8,
      'static:login:another_one',
      'group-token',
      $anotherLogin
    );

    $result = $this->dbc->createLoginSession($anotherLogin);

    $this->assertEquals($expectation, $result);
    $this->assertEquals(8, $this->countTableRows('login_sessions'));

    $resultAfter2ndLogin = $this->dbc->createLoginSession($anotherLogin);

    $this->assertEquals($expectation, $resultAfter2ndLogin);
    $this->assertEquals(8, $this->countTableRows('login_sessions'));
  }

  public function test_getLogin_okay(): void {
    $result = $this->dbc->getLogin("test", "pw_hash");
    $this->assertEquals($this->testDataLoginSessions[0]->getLogin(), $result);
  }

  public function test_getLogin_expired(): void {
    $this->expectException(HttpError::class);
    $this->dbc->getLogin("test-expired", "pw_hash");
  }

  public function test_getLogin_wrongPassword(): void {
    $loginSession = $this->dbc->getLogin("test", "wrong");
    $this->assertEquals(FailedLogin::wrongPassword, $loginSession);
  }

  public function test_getLogin_missingPassword(): void {
    $loginSession = $this->dbc->getLogin("test", "");
    $this->assertEquals(FailedLogin::wrongPassword, $loginSession);
  }

  public function test_getLogin_missingPasswordProtected(): void {
    $loginSession = $this->dbc->getLogin("monitor", "wrong");
    $this->assertEquals(FailedLogin::wrongPasswordProtectedLogin, $loginSession);
  }

  public function test_getLogin_missingUser(): void {
    $loginSession = $this->dbc->getLogin("i am void", "");
    $this->assertEquals(FailedLogin::usernameNotFound, $loginSession);
  }

  public function test_getLogin_futureUser(): void {
    $this->expectException(HttpError::class);
    $this->dbc->getLogin("future_user", "pw_hash");
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

  public function test_ownsTest() {
    $result = $this->dbc->ownsTest('person-token', "1");
    $this->assertTrue($result);

    $result = $this->dbc->ownsTest('person-of-future-login-token', "1");
    $this->assertFalse($result);
  }

  public function test_getOrCreateGroupToken(): void {
    $groupToken = $this->dbc->getOrCreateGroupToken($this->testLoginSession->getLogin());
    $expectation = 'group-token';
    $this->assertEquals($expectation, $groupToken);
  }

  public function test_getOrCreateGroupToken_parallel(): void {
    $worker = Amp\Parallel\Worker\createWorker();

    $t1 = $worker->submit(new CreateGroupTokenTask($this->testLoginSession->getLogin(), 1));
    $t2 = $worker->submit(new CreateGroupTokenTask($this->testLoginSession->getLogin(), 2));

    $this->assertEquals($t1->await(), $t2->await());
  }


  private function countTableRows(string $tableName): int {
    return (int) $this->dbc->_("select count(*) as c from $tableName")["c"];
  }
}
