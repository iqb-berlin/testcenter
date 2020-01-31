<?php
use PHPUnit\Framework\TestCase;
require_once "admin/classes/dao/DBConfig.class.php";
require_once "admin/classes/dao/DBConnection.php";


class DBConnectionTest extends TestCase {

    private $dbc;
    /* @type DBConnection
     * @throws Exception
     */

    function setUp() {

        $this->dbc = new DBConnection(new DBConfig(array("type" => "temp")));
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql'); // TODO split database schema and test data
    }


    function tearDown() {

        unset($this->dbc);
    }


    public function test_getWorkspaceName() {

        $result = $this->dbc->getWorkspaceName(1);
        $expectation = 'example_workspace';
        $this->assertEquals($expectation, $result);
    }

}
