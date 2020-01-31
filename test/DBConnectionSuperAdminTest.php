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


    public function test_getUsers() {

        $result = $this->dbc->getUsers();
        $expectation = array(
            array(
                "id" => "2",
                "name" => "i_exist_but_am_not_allowed_anything",
                "email" => null,
                "is_superadmin" => '0'
            ),
            array(
                "id" => "1",
                "name" => "super",
                "email" => null,
                "is_superadmin" => '1'
            )
        );
        $this->assertEquals($expectation, $result);
    }


    public function test_getUserByName() {

        $result = $this->dbc->getUserByName("i_exist_but_am_not_allowed_anything");
        $expectation = array(
            "id" => "2",
            "name" => "i_exist_but_am_not_allowed_anything",
            "email" => null,
            "is_superadmin" => '0'
        );
        $this->assertEquals($expectation, $result);
    }



}
