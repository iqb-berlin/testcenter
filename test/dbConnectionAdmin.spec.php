<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "admin/classes/exception/HttpError.class.php";
require_once "admin/classes/dao/DBConfig.class.php";
require_once "admin/classes/dao/DBConnection.php";
require_once "admin/classes/dao/DBConnectionAdmin.php";

class DBConnectionAdminTest extends TestCase {

    private $dbc;
    /* @type DBConnection
     * @throws Exception
     */

    function setUp() {

        $this->dbc = new DBConnectionAdmin(new DBConfig(array("type" => "temp")));
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql'); // TODO split database schema and test data
    }


    function tearDown() {

        unset($this->dbc);
    }


    function test_login() {

        $token = $this->dbc->login('super', 'user123');
        $this->assertNotNull($token);

        $this->expectException("HttpError");
        $this->dbc->login('peter', 'lusting');
    }


    function test_getLoginName() {

        $token = $this->dbc->login('super', 'user123');
        $result = $this->dbc->getLoginName($token);
        $expect = "super";
        $this->assertEquals($result, $expect);
    }


    function test_getWorkspaces() {

        $token = $this->dbc->login('super', 'user123');
        $result = $this->dbc->getWorkspaces($token);
        $expect = array(
            array(
                'id'    =>  1,
                'name'  =>  'example_workspace',
                'role'  => 'RW'
            )
        );
        $this->assertEquals($result, $expect);

        $token = $this->dbc->login('i_exist_but_am_not_allowed_anything', 'user123');
        $result = $this->dbc->getWorkspaces($token);
        $this->assertEquals($result, array());
    }


    function test_hasAdminAccessToWorkspace() {

        $token = $this->dbc->login('super', 'user123');
        $result = $this->dbc->hasAdminAccessToWorkspace($token, 1);
        $this->assertEquals($result, true);

        $token = $this->dbc->login('i_exist_but_am_not_allowed_anything', 'user123');
        $result = $this->dbc->hasAdminAccessToWorkspace($token, 1);
        $this->assertEquals($result, false);
    }

    function test_getWorkspaceRole() {

        $token = $this->dbc->login('super', 'user123');
        $result = $this->dbc->getWorkspaceRole($token, 1);
        $this->assertEquals($result, "RW");

        $token = $this->dbc->login('i_exist_but_am_not_allowed_anything', 'user123');
        $result = $this->dbc->getWorkspaceRole($token, 1);
        $this->assertEquals($result, "");
    }



}
