<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "admin/classes/exception/HttpError.class.php";
require_once "admin/classes/dao/DBConfig.class.php";
require_once "admin/classes/dao/DBConnection.class.php";
require_once "admin/classes/dao/DBConnectionSuperAdmin.class.php";


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


    public function test_getWorkspacesByUser() {

        $result = $this->dbc->getWorkspacesByUser(1);
        $expectation = array(
            array(
                "id" => 1,
                "name" => "example_workspace",
                "selected" => true,
                "role" => "RW"
            )
        );
        $this->assertEquals($expectation, $result);

        $result = $this->dbc->getWorkspacesByUser(2);
        $expectation = array(
            array(
                "id" => 1,
                "name" => "example_workspace",
                "selected" => false,
                "role" => ""
            )
        );
        $this->assertEquals($expectation, $result);
    }


    public function test_getMapWorkspaceToRoleByUser() {

        $result = $this->dbc->getMapWorkspaceToRoleByUser(1);
        $expectation = array(
            "1" => "RW"
        );
        $this->assertEquals($expectation, $result);

        $result = $this->dbc->getMapWorkspaceToRoleByUser(2);
        $expectation = array();
        $this->assertEquals($expectation, $result);

        $result = $this->dbc->getMapWorkspaceToRoleByUser(33);
        $expectation = array();
        $this->assertEquals($expectation, $result);
    }


    public function test_setWorkspaceRightsByUser() {

        $this->dbc->setWorkspaceRightsByUser(1, array(
            (object) array('id' => '1', 'role' => 'XX'),
        ));

        $result = $this->dbc->getMapWorkspaceToRoleByUser(1);
        $expectation = array(
            1 => 'XX'
        );
        $this->assertEquals($expectation, $result);
    }


    public function test_setPassword() {

        $this->dbc->setPassword(1, "new_password");

        $result = $this->dbc->checkPassword(1, "wrong_password");
        $this->assertNotNull(false, $result);

        $result = $this->dbc->checkPassword(1, "new_password");
        $this->assertNotNull(true, $result);
    }


    public function test_addUser() {

        $this->dbc->addUser("a_third_user", "somepw");
        $result = $this->dbc->getUserByName("a_third_user");
        $expectation = array(
            "id" => "3",
            "name" => "a_third_user",
            "email" => null,
            "is_superadmin" => '0'
        );
        $this->assertEquals($expectation, $result);

        $this->expectException('HttpError');
        $this->dbc->addUser("a_third_user", "again");


        $this->expectException('HttpError');
        $this->dbc->addUser("a_third_user", "again");
    }


    public function test_renameWorkspace() {

        $this->dbc->setWorkspaceName(1, 'new_name');
        $result = $this->dbc->getWorkspaceName(1);
        $expectation = 'new_name';
        $this->assertEquals($expectation, $result);

        $this->expectException('HttpError');
        $this->dbc->setWorkspaceName(33, 'new_name');
    }


    public function test_deleteWorkspaces() {

        $this->dbc->deleteWorkspaces(array(1));
        $result = $this->dbc->getWorkspaces();
        $this->assertEquals(array(), $result);
    }


    public function test_getUsersByWorkspace() {

        $result = $this->dbc->getUsersByWorkspace(1);
        $expectation = array(
            array(
                'id' => '2',
                'name' => 'i_exist_but_am_not_allowed_anything',
                'selected' => false,
                'role' => ''
            ),
            array(
                'id' => '1',
                'name' => 'super',
                'selected' => true,
                'role' => 'RW'
            )
        );
        $this->assertEquals($expectation, $result);
    }


    public function test_getWorkspaceRolesPerUser() {

        $result = $this->dbc->getMapUserToRoleByWorkspace(1);
        $expectation = array(
            1 => 'RW'
        );
        $this->assertEquals($expectation, $result);

        $result = $this->dbc->getMapWorkspaceToRoleByUser(33);
        $expectation = array();
        $this->assertEquals($expectation, $result);
    }


    public function test_setUserRightsForWorkspace() {

        $this->dbc->setUserRightsForWorkspace(1, array(
            (object) array('id' => '1', 'role' => 'RO'),
            (object) array('id' => '2', 'role' => 'MO')
        ));

        $result = $this->dbc->getMapUserToRoleByWorkspace(1);
        $expectation = array(
            1 => 'RO',
            2 => 'MO'
        );
        $this->assertEquals($expectation, $result);
    }




}
