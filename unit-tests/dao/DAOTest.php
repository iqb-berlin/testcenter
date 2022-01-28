<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class DAOTest extends TestCase {

    private DAO $dbc;

    function setUp(): void {

        require_once "classes/exception/HttpError.class.php";
        require_once "classes/data-collection/DataCollection.class.php";
        require_once "classes/helper/DB.class.php";
        require_once "classes/helper/JSON.class.php";
        require_once "classes/data-collection/DBConfig.class.php";
        require_once "classes/dao/DAO.class.php";

        DB::connect(new DBConfig(["type" => "temp"]));
        $this->dbc = new DAO();
        $this->dbc->runFile(REAL_ROOT_DIR . '/scripts/sql-schema/sqlite.sql');
        $this->dbc->runFile(REAL_ROOT_DIR . '/unit-tests/testdata.sql');
    }


    function tearDown(): void {

        unset($this->dbc);
    }


    function test_getDBSchemaVersion() {

        $result = $this->dbc->getDBSchemaVersion();
        $this->assertEquals('0.0.0-no-entry', $result, 'No entry in meta table');

        $this->dbc->_("INSERT INTO meta (metaKey, value) VALUES ('dbSchemaVersion', '10.0.0')");
        $result = $this->dbc->getDBSchemaVersion();
        $this->assertEquals('10.0.0', $result, 'Version present');

        $this->dbc->_("Drop Table meta");
        $result = $this->dbc->getDBSchemaVersion();
        $this->assertEquals('0.0.0-no-table', $result, 'No meta table present');
    }


    public function test_getMeta() {

        $result = $this->dbc->getMeta(['cat1']);
        $expectation = [
            'cat1' => [
                'keyA' => 'valueA',
                'keyB' => 'valueB'
            ]
        ];
        $this->assertEquals($expectation, $result);


        $result = $this->dbc->getMeta(['cat1', 'cat2']);
        $expectation = [
            'cat1' => [
                'keyA' => 'valueA',
                'keyB' => 'valueB'
            ],
            'cat2' => [
                'keyA' => 'valueA',
                'keyB' => 'valueB'
            ]
        ];
        $this->assertEquals($expectation, $result);
    }


    public function test_setMeta() {

        $this->dbc->setMeta('new', 'aKey', 'aValue');
        $result = $this->dbc->getMeta(['new']);
        $expectation = [
            'new' => [
                'aKey' => 'aValue',
            ]
        ];
        $this->assertEquals($expectation, $result);

        $this->dbc->setMeta('new', 'aKey', 'newValue');
        $result = $this->dbc->getMeta(['new']);
        $expectation = [
            'new' => [
                'aKey' => 'newValue',
            ]
        ];
        $this->assertEquals($expectation, $result);
    }


    public function test_getTestFullState() {

        $result = $this->dbc->getTestFullState(['testState' => '{"A":"B"}', "locked" => true, "running" => true]);
        $this->assertSame(["A" => "B", "status" => 'locked'], $result);

        $result = $this->dbc->getTestFullState(['testState' => '{"A":"B"}', "locked" => false, "running" => false]);
        $this->assertSame(["A" => "B", "status" => 'pending'], $result);

        $result = $this->dbc->getTestFullState(['testState' => '{"A":"B"}', "locked" => false, "running" => true]);
        $this->assertSame(["A" => "B", "status" => 'running'], $result);

        $result = $this->dbc->getTestFullState(['testState' => '{"A":"B"}', "locked" => true, "running" => false]);
        $this->assertSame(["A" => "B", "status" => 'locked'], $result);
    }


    public function test_getGlobalIds() {

        $expectation = [
            1 => [
                'testdata.sql' => [
                    'login' => ['future_user', 'monitor', 'sample_user', 'test', 'test-expired'],
                    'group' => ['sample_group']
                ]
            ]
        ];
        $result = $this->dbc->getGlobalIds();
        $this->assertEquals($expectation, $result);
    }
}
