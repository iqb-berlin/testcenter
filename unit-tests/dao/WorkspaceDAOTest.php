<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class WorkspaceDAOTest extends TestCase {

    private WorkspaceDAO $dbc;

    function setUp(): void {

        require_once "classes/exception/HttpError.class.php";
        require_once "classes/data-collection/DataCollection.class.php";
        require_once "classes/helper/DB.class.php";
        require_once "classes/helper/JSON.class.php";
        require_once "classes/data-collection/DBConfig.class.php";
        require_once "classes/dao/DAO.class.php";
        require_once "classes/dao/WorkspaceDAO.class.php";

        DB::connect(new DBConfig(["type" => "temp"]));
        $this->dbc = new WorkspaceDAO();
        $this->dbc->runFile(REAL_ROOT_DIR . '/scripts/sql-schema/sqlite.sql');
        $this->dbc->runFile(REAL_ROOT_DIR . '/unit-tests/testdata.sql');
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


    public function test_getWorkspaceName() {

        $result = $this->dbc->getWorkspaceName(1);
        $expectation = 'example_workspace';
        $this->assertEquals($expectation, $result);
    }
}
