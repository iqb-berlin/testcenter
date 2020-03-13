<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/exception/HttpError.class.php";
require_once "classes/data/AbstractDataCollection.class.php";
require_once "classes/helper/DB.class.php";
require_once "classes/data/DBConfig.class.php";
require_once "classes/dao/DAO.class.php";
require_once "classes/dao/AdminDAO.class.php";

class AdminDAOTest extends TestCase {

    private $dbc;
    /* @type DAO
     * @throws Exception
     */

    function setUp() {

        DB::connect(new DBConfig(["type" => "temp"]));
        $this->dbc = new AdminDAO();
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql');
        $this->dbc->runFile('test/testdata.sql');
    }


    function tearDown() {

        unset($this->dbc);
    }


    function test_login() {

        $token = $this->dbc->createAdminToken('super', 'user123');
        $this->assertNotNull($token);

        $this->expectException("HttpError");
        $this->dbc->createAdminToken('peter', 'lustig');
    }


    function test_validateToken() {

        $token = $this->dbc->createAdminToken('super', 'user123');
        $result = $this->dbc->getAdmin($token);
        $this->assertEquals($result['userId'], '1');
        $this->assertEquals($result['name'], 'super');
        $this->assertEquals($result['isSuperadmin'], '1');
    }


    function test_getWorkspaces() {

        $token = $this->dbc->createAdminToken('super', 'user123');
        $result = $this->dbc->getWorkspaces($token);
        $expect = array(
            array(
                'id'    =>  1,
                'name'  =>  'example_workspace',
                'role'  => 'RW'
            )
        );
        $this->assertEquals($result, $expect);

        $token = $this->dbc->createAdminToken('i_exist_but_am_not_allowed_anything', 'user123');
        $result = $this->dbc->getWorkspaces($token);
        $this->assertEquals($result, array());
    }


    function test_hasAdminAccessToWorkspace() {

        $token = $this->dbc->createAdminToken('super', 'user123');
        $result = $this->dbc->hasAdminAccessToWorkspace($token, 1);
        $this->assertEquals($result, true);

        $token = $this->dbc->createAdminToken('i_exist_but_am_not_allowed_anything', 'user123');
        $result = $this->dbc->hasAdminAccessToWorkspace($token, 1);
        $this->assertEquals($result, false);
    }


    function test_getWorkspaceRole() {

        $token = $this->dbc->createAdminToken('super', 'user123');
        $result = $this->dbc->getWorkspaceRole($token, 1);
        $this->assertEquals($result, "RW");

        $token = $this->dbc->createAdminToken('i_exist_but_am_not_allowed_anything', 'user123');
        $result = $this->dbc->getWorkspaceRole($token, 1);
        $this->assertEquals($result, "");
    }



}
