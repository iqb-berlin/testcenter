<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class SuperAdminDAOTest extends TestCase {

    private SuperAdminDAO $dbc;
    private WorkspaceDAO $workspaceDAO;

    function setUp(): void {

        require_once "src/exception/HttpError.class.php"
        ;
        require_once "src/data-collection/DataCollection.class.php";
        require_once "src/data-collection/DBConfig.class.php";
        require_once "src/helper/DB.class.php";
        require_once "src/helper/Password.class.php";
        require_once "src/dao/DAO.class.php";
        require_once "src/dao/SuperAdminDAO.class.php";

        DB::connect(new DBConfig(["type" => "temp"]));
        $this->dbc = new SuperAdminDAO();
        $this->dbc->runFile(REAL_ROOT_DIR . '/backend/test/unit/database.sql');
        $this->dbc->runFile(REAL_ROOT_DIR . '/backend/test/unit/testdata.sql');
    }


    function tearDown(): void {

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
                "isSuperadmin" => false
            ),
            array(
                "id" => "1",
                "name" => "super",
                "email" => null,
                "isSuperadmin" => true
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
            "isSuperadmin" => '0'
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

        $result = $this->dbc->createUser("a_third_user", "some_password");
        $expectation = [
            "id" => "3",
            "name" => "a_third_user",
            "email" => null,
            "isSuperadmin" => '0'
        ];
        $this->assertEquals($expectation, $result);

        $result2 = $this->dbc->getUserByName("a_third_user");
        $this->assertEquals($expectation, $result2);

        $this->expectException('HttpError');
        $this->dbc->createUser("a_third_user", "again");
    }


    public function test_renameWorkspace() {

        $this->dbc->setWorkspaceName(1, 'new_name');
        $result = $this->dbc->_('select name from workspaces where id = 1')['name'];
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


    public function test_setSuperAdminStatus() {

        $this->dbc->setSuperAdminStatus(2, true);

        $result = $this->dbc->getUserByName("i_exist_but_am_not_allowed_anything");
        $expectation = array(
            "id" => "2",
            "name" => "i_exist_but_am_not_allowed_anything",
            "email" => null,
            "isSuperadmin" => '1'
        );
        $this->assertEquals($expectation, $result);

        $this->dbc->setSuperAdminStatus(2, false);

        $result = $this->dbc->getUserByName("i_exist_but_am_not_allowed_anything");
        $expectation = array(
            "id" => "2",
            "name" => "i_exist_but_am_not_allowed_anything",
            "email" => null,
            "isSuperadmin" => '0'
        );
        $this->assertEquals($expectation, $result);
    }


    public function test_createWorkspace() {

        $expectation = [
          "id" => 2,
          "name" => 'new_workspace'
        ];
        $result = $this->dbc->createWorkspace('new_workspace');
        $this->assertEquals($expectation, $result);

        try {
            $this->dbc->createWorkspace('new_workspace');
            $this->fail("Exception expected.");
        } catch (HttpError $exception) {
            $this->assertEquals($exception->getCode(), 400);
        }

        $result = $this->dbc->getWorkspaces();
        $expectation = [
            [
                "id" => 1,
                "name" => "example_workspace"
            ],
            [
                "id" => 2,
                "name" => "new_workspace"
            ],

        ];
        $this->assertEquals($expectation, $result);
    }

    public function test_getOrCreateWorkspace() {

        $result = $this->dbc->getOrCreateWorkspace("example_workspace");
        $expectation = [
            "id" => 1,
            "name" => "example_workspace"
        ];
        $this->assertEquals($expectation, $result);

        $result = $this->dbc->getOrCreateWorkspace("new_workspace");
        $expectation = [
            "id" => 2,
            "name" => "new_workspace"
        ];
        $this->assertEquals($expectation, $result);
    }
}
