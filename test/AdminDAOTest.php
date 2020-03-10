<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/exception/HttpError.class.php";
require_once "classes/data/DBConfig.class.php";
require_once "classes/dao/DAO.class.php";
require_once "classes/dao/AdminDAO.class.php";

class AdminDAOTest extends TestCase {

    private $dbc;
    /* @type DAO
     * @throws Exception
     */

    function setUp() {

        $this->dbc = new AdminDAO(new DBConfig(array("type" => "temp")));
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql'); // TODO split database schema and test data
    }


    function tearDown() {

        unset($this->dbc);
    }


    function test_login() {

        $token = $this->dbc->login('super', 'user123');
        $this->assertNotNull($token);

        $this->expectException("HttpError");
        $this->dbc->login('peter', 'lustig');
    }


    function test_validateToken() {

        $token = $this->dbc->login('super', 'user123');
        $result = $this->dbc->validateToken($token);
        $this->assertEquals($result['user_id'], '1');
        $this->assertEquals($result['user_name'], 'super');
        $this->assertEquals($result['user_is_superadmin'], '1');
        $this->assertEquals(isset($result['valid_until']), true);
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
