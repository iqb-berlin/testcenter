<?php
/** @noinspection PhpUnhandledExceptionInspection */

declare(strict_types=1);

use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class AdminDAOTest extends TestCase {
  private AdminDAO $dbc;

  function setUp(): void {
    require_once "test/unit/TestDB.class.php";
    TestDB::setUp();

    $this->dbc = new AdminDAO();
    $this->dbc->runFile(ROOT_DIR . '/backend/test/unit/testdata.sql');
  }

  function tearDown(): void {
    unset($this->dbc);
  }

  public function test_login() {
    $token = $this->dbc->createAdminToken('super', 'user123');
    $this->assertNotNull($token);

    $rejection = $this->dbc->createAdminToken('peter', 'peterspassword');
    $this->assertEquals(FailedLogin::usernameNotFound, $rejection);

    $rejection = $this->dbc->createAdminToken('super', 'peterspassword');
    $this->assertEquals(FailedLogin::wrongPassword, $rejection);
  }

  public function test_validateToken() {
    $token = $this->dbc->createAdminToken('super', 'user123');
    $result = $this->dbc->getAdmin($token);
    $this->assertEquals(1, $result->getId());
    $this->assertEquals('super', $result->getName());
    $this->assertTrue($result->isSuperadmin());
  }

  public function test_getWorkspaces() {
    $token = $this->dbc->createAdminToken('super', 'user123');
    $result = $this->dbc->getWorkspaces($token);
    $expect = [new WorkspaceData(1, 'example_workspace', 'RW')];
    $this->assertEquals($result, $expect);

    $token = $this->dbc->createAdminToken('i_exist_but_am_not_allowed_anything', 'user123');
    $result = $this->dbc->getWorkspaces($token);
    $this->assertEquals(array(), $result);
  }

  public function test_hasAdminAccessToWorkspace() {
    $token = $this->dbc->createAdminToken('super', 'user123');
    $result = $this->dbc->hasAdminAccessToWorkspace($token, 1);
    $this->assertEquals(true, $result);

    $token = $this->dbc->createAdminToken('i_exist_but_am_not_allowed_anything', 'user123');
    $result = $this->dbc->hasAdminAccessToWorkspace($token, 1);
    $this->assertEquals(false, $result);
  }

  public function test_getWorkspaceRole() {
    $token = $this->dbc->createAdminToken('super', 'user123');
    $result = $this->dbc->getWorkspaceRole($token, 1);
    $this->assertEquals("RW", $result);

    $token = $this->dbc->createAdminToken('i_exist_but_am_not_allowed_anything', 'user123');
    $result = $this->dbc->getWorkspaceRole($token, 1);
    $this->assertEquals("", $result);
  }

  public function testGetResponseReportData(): void {
    // Arrange
    $workspaceId = 1;
    $groups = ['sample_group'];

    // Act
    $actualResponseReportData = $this->dbc->getResponseReportData($workspaceId, $groups);

    // Assert
    $expectedResponseReportData = [
      [
        'groupname' => 'sample_group',
        'loginname' => 'sample_user',
        'code' => 'xxx',
        'bookletname' => 'first sample test',
        'unitname' => 'UNIT_1',
        'laststate' => '{"SOME_STATE":"WHATEVER"}',
        'originalUnitId' => '',
        'responses' => [
          [
            'id' => "all",
            'content' => "{\"name\":\"Sam Sample\",\"age\":34}",
            'ts' => 1597903000,
            'responseType' => 'the-response-type'
          ]
        ]
      ],
      [
        'groupname' => 'sample_group',
        'loginname' => 'sample_user',
        'code' => 'xxx',
        'bookletname' => 'first sample test',
        'unitname' => 'UNIT.SAMPLE',
        'laststate' => '{"PRESENTATIONCOMPLETE":"yes"}',
        'originalUnitId' => '',
        'responses' => [
          [
            'id' => "all",
            'content' => "{\"name\":\"Elias Example\",\"age\":35}",
            'ts' => 1597903000,
            'responseType' => 'the-response-type'
          ],
          [
            'id' => "other",
            'content' => "{\"other\":\"stuff\"}",
            'ts' => 1597903000,
            'responseType' => 'the-response-type'
          ]
        ]
      ]
    ];

    parent::assertSame($expectedResponseReportData, $actualResponseReportData);
  }

  function testGetLogReportData(): void {
    // Arrange
    $workspaceId = 1;
    $groups = ['sample_group'];

    // Act
    $actualLogReportData = $this->dbc->getLogReportData($workspaceId, $groups);

    // Assert
    $expectedLogReportData = [
      [
        'groupname' => 'sample_group',
        'loginname' => 'sample_user',
        'code' => 'xxx',
        'bookletname' => 'first sample test',
        'unitname' => 'UNIT.SAMPLE',
        'originalUnitId' => '',
        'timestamp' => 1597903000,
        'logentry' => 'sample unit log'
      ],
      [
        'groupname' => 'sample_group',
        'loginname' => 'sample_user',
        'code' => 'xxx',
        'bookletname' => 'first sample test',
        'unitname' => '',
        'originalUnitId' => '',
        'timestamp' => 1597903000,
        'logentry' => 'sample log entry'
      ]
    ];

    parent::assertSame($expectedLogReportData, $actualLogReportData);
  }

  function testGetReviewReportData(): void {
    // Arrange
    $workspaceId = 1;
    $groups = ['review_group'];

    // Act
    $actualReviewReportData = $this->dbc->getReviewReportData($workspaceId, $groups);

    // Assert
    $expectedReviewReportData = [
      [
        'groupname' => 'review_group',
        'loginname' => 'test-review',
        'code' => '',
        'bookletname' => 'BOOKLET.SAMPLE-1#bookletstate=isset',
        'unitname' => 'UNIT_1',
        'priority' => 1,
        'categories' => '',
        'reviewtime' => '2030-01-01 12:00:00',
        'entry' => 'this is a sample unit review',
        'page' => null,
        'pagelabel' => null,
        'originalUnitId' => '',
        'userAgent' => ''
      ],
      [
        'groupname' => 'review_group',
        'loginname' => 'test-review',
        'code' => '',
        'bookletname' =>  'BOOKLET.SAMPLE-1#bookletstate=isset',
        'unitname' => '',
        'priority' => 1,
        'categories' => '',
        'reviewtime' => '2030-01-01 12:00:00',
        'entry' => 'sample booklet review',
        'page' => null,
        'pagelabel' => null,
        'originalUnitId' => '',
        'userAgent' => ''
      ]
    ];

    parent::assertSame($expectedReviewReportData, $actualReviewReportData);
  }

  function test_addCommand() {
    $command = new Command(-1, 'a_keyword', 1597905000, 'first_argument', 'second_argument');
    $this->dbc->storeCommand(1, 1, $command);
    $expectation = [
      "id" => 5,
      "test_id" => 1,
      "keyword" => 'a_keyword',
      "parameter" => '["first_argument","second_argument"]',
      "commander_id" => 1,
      'timestamp' => '2020-08-20 08:30:00',
      'executed' => '0'
    ];
    $result = $this->dbc->_("select * from test_commands where keyword='a_keyword'");
    $this->assertEquals($expectation, $result);
  }

  function test_getTest() {
    $expectation = [
      'locked' => '0',
      'id' => '1',
      'laststate' => '{"CURRENT_UNIT_ID":"UNIT_1"}',
      'label' => 'first test label'
    ];
    $result = $this->dbc->getTest(1);
    $this->assertEquals($expectation, $result);
  }

  function test_deleteResultData() {
    $this->dbc->deleteResultData(1, 'not_existing');
    $this->assertGreaterThan(0, $this->countTableRows('login_sessions'));
    $this->assertGreaterThan(0, $this->countTableRows('person_sessions'));
    $this->assertGreaterThan(0, $this->countTableRows('tests'));
    $this->assertGreaterThan(0, $this->countTableRows('test_logs'));
    $this->assertGreaterThan(0, $this->countTableRows('units'));
    $this->assertGreaterThan(0, $this->countTableRows('unit_data'));
    $this->assertGreaterThan(0, $this->countTableRows('unit_logs'));
    $this->assertGreaterThan(0, $this->countTableRows('unit_reviews'));
    $this->assertGreaterThan(0, $this->countTableRows('test_reviews'));

    $this->dbc->deleteResultData(1, 'sample_group');
    $this->dbc->deleteResultData(1, 'review_group');
    $this->assertEquals(0, $this->countTableRows('login_sessions'));
    $this->assertEquals(0, $this->countTableRows('person_sessions'));
    $this->assertEquals(0, $this->countTableRows('tests'));
    $this->assertEquals(0, $this->countTableRows('test_logs'));
    $this->assertEquals(0, $this->countTableRows('units'));
    $this->assertEquals(0, $this->countTableRows('unit_data'));
    $this->assertEquals(0, $this->countTableRows('unit_logs'));
    $this->assertEquals(0, $this->countTableRows('unit_reviews'));
    $this->assertEquals(0, $this->countTableRows('test_reviews'));
  }

  public function test_getResultStats() {
    $expectation = [
      [
        'groupName' => 'sample_group',
        'groupLabel' => 'Sample Group',
        'bookletsStarted' => 2,
        'numUnitsMin' => 0,
        'numUnitsMax' => 2,
        'numUnitsTotal' => 2,
        'numUnitsAvg' => 1.0,
        'lastChange' => 1643011260
      ],
      [
        'groupName' => 'review_group',
        'groupLabel' => 'Review Group',
        'bookletsStarted' => 1,
        'numUnitsMin' => 1,
        'numUnitsMax' => 1,
        'numUnitsTotal' => 1,
        'numUnitsAvg' => 1.0,
        'lastChange' => 1643011260
      ]
    ];
    $result = $this->dbc->getResultStats(1);
    $this->assertSame($expectation, $result);

    $someTestState = '{"CONTROLLER":"TERMINATED","CONNECTION":"LOST","CURRENT_UNIT_ID":"UNIT.SAMPLE","FOCUS":"HAS","TESTLETS_TIMELEFT":"{\"a_testlet_with_restrictions\":0}"}';
    $this->dbc->_("insert into tests (name, file_id, person_id, locked, running, timestamp_server, laststate) values ('BOOKLET.SAMPLE-2', 'BOOKLET.SAMPLE-2', 1,  0, 1, '2023-11-14 11:13:20', '$someTestState')");
    $this->dbc->_("insert into units (name, booklet_id) values ('UNIT_1', 4)");

    $expectation = [
      [
        'groupName' => 'sample_group',
        'groupLabel' => 'Sample Group',
        'bookletsStarted' => 3,
        'numUnitsMin' => 0,
        'numUnitsMax' => 2,
        'numUnitsTotal' => 3,
        'numUnitsAvg' => 1.0,
        'lastChange' => 1699956800
      ],
      [
        'groupName' => 'review_group',
        'groupLabel' => 'Review Group',
        'bookletsStarted' => 1,
        'numUnitsMin' => 1,
        'numUnitsMax' => 1,
        'numUnitsTotal' => 1,
        'numUnitsAvg' => 1.0,
        'lastChange' => 1643011260
      ]
    ];
    $result = $this->dbc->getResultStats(1);
    $this->assertSame($expectation, $result);

    $this->dbc->_('delete from test_reviews');
    $result = $this->dbc->getResultStats(1);
    $this->assertSame($expectation, $result);

    $this->dbc->_('delete from unit_reviews');
    $result = $this->dbc->getResultStats(1);
    $this->assertSame([$expectation[0]], $result);

    $this->dbc->_(
      "insert into test_reviews (booklet_id, reviewtime, priority, categories, entry)
      values (3, '2030-01-01 12:00:00', 1, '', 'new booklet review')"
    );
    $result = $this->dbc->getResultStats(1);
    $this->assertSame($expectation, $result);
  }

  public function test_getTestSessions() {
    $expectation = [
      [
        'personId' => 1,
        'timestamp' => 1643011260,
        'testId' => 1,
        'groupName' => 'sample_group',
        'groupLabel' => 'Sample Group',
        'personLabel' => 'sample_user/xxx',
        'mode' => 'run-hot-return',
        'testState' => [
          'CURRENT_UNIT_ID' => 'UNIT_1',
          'status' => 'running'
        ],
        'bookletName' => 'first sample test',
        'unitName' => 'UNIT_1',
        'unitState' => [
          'SOME_STATE' => 'WHATEVER'
        ]
      ],
      [
        'personId' => 1,
        'timestamp' => 1643011260,
        'testId' => 2,
        'groupName' => 'sample_group',
        'groupLabel' => 'Sample Group',
        'personLabel' => 'sample_user/xxx',
        'mode' => 'run-hot-return',
        'testState' => [
          'status' => 'running',
        ],
        'bookletName' => 'BOOKLET.SAMPLE-1',
        'unitState' => []
      ]
    ];
    // make order-agnostic
    usort($expectation, function ($first, $second) {
      return $first['testId'] <=> $second['testId'];
    });

    $result = $this->dbc->getTestSessions(1, ['sample_group']);
    $resultAsArray = array_map(function (SessionChangeMessage $s) {
      return $s->jsonSerialize();
    }, $result->asArray());
    usort($resultAsArray, function ($first, $second) {
      return $first['testId'] <=> $second['testId'];
    });
    $this->assertSame($expectation, $resultAsArray);

    $result = $this->dbc->getTestSessions(1, []); // all groups
    $resultAsArray = array_map(function (SessionChangeMessage $s) {
      return $s->jsonSerialize();
    }, $result->asArray());
    usort($resultAsArray, function ($first, $second) {
      return $first['testId'] <=> $second['testId'];
    });
    $this->assertSame($expectation, $resultAsArray);

    $result = $this->dbc->getTestSessions(1, ['unknown_group']);
    $resultAsArray = array_map(function (SessionChangeMessage $s) {
      return $s->jsonSerialize();
    }, $result->asArray());
    usort($resultAsArray, function ($first, $second) {
      return $first['testId'] <=> $second['testId'];
    });
    $this->assertSame([], $resultAsArray);
  }

  public function test_getGroup(): void {
    $result = $this->dbc->getGroup('sample_group');
    $expectation = new Group('sample_group', 'Sample Group');
    $this->assertEquals($expectation, $result);

    $result = $this->dbc->getGroup('gibberish');
    $this->assertNull($result);
  }

  private function countTableRows(string $tableName): int {
    return (int) $this->dbc->_("select count(*) as c from $tableName")["c"];
  }
}
