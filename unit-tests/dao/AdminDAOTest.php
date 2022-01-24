<?php /** @noinspection PhpUnhandledExceptionInspection */

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once "classes/data-collection/DataCollection.class.php";
require_once "classes/data-collection/DataCollectionTypeSafe.class.php";


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class AdminDAOTest extends TestCase {

    private AdminDAO $dbc;

    function setUp(): void {

        require_once "classes/exception/HttpError.class.php";
        require_once "classes/data-collection/DBConfig.class.php";
        require_once "classes/data-collection/Command.class.php";
        require_once "classes/dao/DAO.class.php";
        require_once "classes/dao/AdminDAO.class.php";
        require_once "classes/helper/DB.class.php";
        require_once "classes/helper/TimeStamp.class.php";
        require_once "classes/helper/Password.class.php";

        DB::connect(new DBConfig(["type" => "temp"]));
        $this->dbc = new AdminDAO();
        $this->dbc->runFile(REAL_ROOT_DIR . '/scripts/sql-schema/sqlite.sql');
        $this->dbc->runFile(REAL_ROOT_DIR . '/unit-tests/testdata.sql');
    }


    function tearDown(): void {

        unset($this->dbc);
    }


    function test_login() {

        $token = $this->dbc->createAdminToken('super', 'user123');
        $this->assertNotNull($token);

        $this->expectException("HttpError");
        $this->dbc->createAdminToken('peter', 'peterspassword');
    }


    function test_validateToken() {

        $token = $this->dbc->createAdminToken('super', 'user123');
        $result = $this->dbc->getAdmin($token);
        $this->assertEquals('1', $result['userId']);
        $this->assertEquals('super', $result['name']);
        $this->assertEquals('1', $result['isSuperadmin']);
    }


    function test_getWorkspaces() {

        $token = $this->dbc->createAdminToken('super', 'user123');
        $result = $this->dbc->getWorkspaces($token);
        $expect = array(
            array(
                'id' => 1,
                'name' => 'example_workspace',
                'role' => 'RW'
            )
        );
        $this->assertEquals($result, $expect);

        $token = $this->dbc->createAdminToken('i_exist_but_am_not_allowed_anything', 'user123');
        $result = $this->dbc->getWorkspaces($token);
        $this->assertEquals(array(), $result);
    }


    function test_hasAdminAccessToWorkspace() {

        $token = $this->dbc->createAdminToken('super', 'user123');
        $result = $this->dbc->hasAdminAccessToWorkspace($token, 1);
        $this->assertEquals(true, $result);

        $token = $this->dbc->createAdminToken('i_exist_but_am_not_allowed_anything', 'user123');
        $result = $this->dbc->hasAdminAccessToWorkspace($token, 1);
        $this->assertEquals(false, $result);
    }


    function test_getWorkspaceRole() {

        $token = $this->dbc->createAdminToken('super', 'user123');
        $result = $this->dbc->getWorkspaceRole($token, 1);
        $this->assertEquals("RW", $result);

        $token = $this->dbc->createAdminToken('i_exist_but_am_not_allowed_anything', 'user123');
        $result = $this->dbc->getWorkspaceRole($token, 1);
        $this->assertEquals("", $result);
    }


    function testGetResponseReportData(): void {

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
                'timestamp' => "1597903000",
                'logentry' => 'sample unit log'
            ], [
                'groupname' => 'sample_group',
                'loginname' => 'sample_user',
                'code' => 'xxx',
                'bookletname' => 'first sample test',
                'unitname' => '',
                'timestamp' => "1597903000",
                'logentry' => 'sample log entry'
            ]
        ];

        parent::assertSame($expectedLogReportData, $actualLogReportData);
    }


    function testGetReviewReportData(): void {

        // Arrange
        $workspaceId = 1;
        $groups = ['sample_group'];

        // Act
        $actualReviewReportData = $this->dbc->getReviewReportData($workspaceId, $groups);

        // Assert
        $expectedReviewReportData = [
            [
                'groupname' => 'sample_group',
                'loginname' => 'sample_user',
                'code' => 'xxx',
                'bookletname' => 'first sample test',
                'unitname' => 'UNIT.SAMPLE',
                'priority' => '1',
                'categories' => '',
                'reviewtime' => '2030-01-01 12:00:00',
                'entry' => 'this is a sample unit review'
            ], [
                'groupname' => 'sample_group',
                'loginname' => 'sample_user',
                'code' => 'xxx',
                'bookletname' => 'first sample test',
                'unitname' => '',
                'priority' => '1',
                'categories' => '',
                'reviewtime' => '2030-01-01 12:00:00',
                'entry' => 'sample booklet review'
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

        $this->dbc->deleteResultData(1, 'not_existsing');
        $this->assertGreaterThan(0, $this->countTableRows('login_sessions'));
        $this->assertGreaterThan(0, $this->countTableRows('person_sessions'));
        $this->assertGreaterThan(0, $this->countTableRows('tests'));
        $this->assertGreaterThan(0, $this->countTableRows('test_logs'));
        $this->assertGreaterThan(0, $this->countTableRows('units'));
        $this->assertGreaterThan(0, $this->countTableRows('unit_data'));
        $this->assertGreaterThan(0, $this->countTableRows('unit_logs'));

        $this->dbc->deleteResultData(1, 'sample_group');
        $this->assertEquals(0, $this->countTableRows('login_sessions'));
        $this->assertEquals(0, $this->countTableRows('person_sessions'));
        $this->assertEquals(0, $this->countTableRows('tests'));
        $this->assertEquals(0, $this->countTableRows('test_logs'));
        $this->assertEquals(0, $this->countTableRows('units'));
        $this->assertEquals(0, $this->countTableRows('unit_data'));
        $this->assertEquals(0, $this->countTableRows('unit_logs'));
    }


    public function test_getResultStats() {

        $expectation = [[
            'groupName' => 'sample_group',
            'bookletsStarted' => 2,
            'numUnitsMin' => 0,
            'numUnitsMax' => 2,
            'numUnitsTotal' => 2,
            'numUnitsAvg' => 1.0,
            'lastChange' => 1643014459
        ]];
        $result = $this->dbc->getResultStats(1);
        $this->assertSame($expectation, $result);

        $this->dbc->_("insert into tests (name, person_id, locked, running, timestamp_server) values ('BOOKLET.SAMPLE-2', 1,  0, 1, 1700000000)");
        $this->dbc->_("insert into units (name, booklet_id) values ('UNIT_1', 3)");

        $expectation = [[
            'groupName' => 'sample_group',
            'bookletsStarted' => 3,
            'numUnitsMin' => 0,
            'numUnitsMax' => 2,
            'numUnitsTotal' => 3,
            'numUnitsAvg' => 1.0,
            'lastChange' => 1700000000
        ]];
        $result = $this->dbc->getResultStats(1);
        $this->assertSame($expectation, $result);
    }

    
    private function countTableRows(string $tableName): int {

        return (int) $this->dbc->_("select count(*) as c from $tableName")["c"];
    } 
}
