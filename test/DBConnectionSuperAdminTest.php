<?php
use PHPUnit\Framework\TestCase;
require_once "admin/classes/exception/HttpError.class.php";
require_once "admin/classes/dao/DBConfig.class.php";
require_once "admin/classes/dao/DBConnection.php";
require_once "admin/classes/dao/DBConnectionSuperAdmin.php";


class DBConnectionSuperAdminTest extends TestCase {

    private $dbc;
    /* @type DBConnection
     * @throws Exception
     */

    function setUp() {

        $this->dbc = new DBConnectionSuperAdmin(new DBConfig(array("type" => "temp")));
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql'); // TODO split database schema and test data
    }


    function tearDown() {

        unset($this->dbc);
    }


    public function test_getWorkspaces() {

        $result = $this->dbc->getWorkspaces();
        $expectation = array(
            array(
                "id" => 1,
                "name" => "example_workspace"
            )
        );
        $this->assertEquals($expectation, $result);
    }

}
