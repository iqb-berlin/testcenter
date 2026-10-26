<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class SuperAdminDAOTest extends TestCase {
  private SuperAdminDAO $dbc;

  function setUp(): void {
    require_once "test/unit/TestDB.class.php";

    TestDB::setUp();
    $this->dbc = new SuperAdminDAO();
    $this->dbc->runFile(ROOT_DIR . '/backend/test/unit/testdata.sql');
  }

  function tearDown(): void {
    unset($this->dbc);
  }

  public function test_getWorkspaces() {
    $result = $this->dbc->getWorkspaces();
    $expectation = [
      [
        "id" => 1,
        "name" => "example_workspace",
        "latest_modification_ts" => "2023-01-16 09:00:00"
      ]
    ];
    static::assertEquals($expectation, $result);
  }

  public function test_getUsers() {
    $result = $this->dbc->getUsers();
    $expectation = [
      [
        "id" => "2",
        "name" => "i_exist_but_am_not_allowed_anything",
        "email" => null,
        "isSuperadmin" => false
      ],
      [
        "id" => "1",
        "name" => "super",
        "email" => null,
        "isSuperadmin" => true
      ]
    ];

    static::assertEquals($expectation, $result);
  }

  public function test_getUserByName() {
    $result = $this->dbc->getUserByName("i_exist_but_am_not_allowed_anything");
    $expectation = [
      "id" => "2",
      "name" => "i_exist_but_am_not_allowed_anything",
      "email" => null,
      "isSuperadmin" => false
    ];

    static::assertEquals($expectation, $result);
  }

  public function test_getWorkspacesByUser() {
    $result = $this->dbc->getWorkspacesByUser(1);
    $expectation = [
      [
        "id" => 1,
        "name" => "example_workspace",
        "selected" => true,
        "role" => "RW"
      ]
    ];
    static::assertEquals($expectation, $result);

    $result = $this->dbc->getWorkspacesByUser(2);
    $expectation = [
      [
        "id" => 1,
        "name" => "example_workspace",
        "selected" => false,
        "role" => ""
      ]
    ];
    static::assertEquals($expectation, $result);
  }

  public function test_getMapWorkspaceToRoleByUser() {
    $result = $this->dbc->getMapWorkspaceToRoleByUser(1);
    $expectation = [
      "1" => "RW"
    ];
    static::assertEquals($expectation, $result);

    $result = $this->dbc->getMapWorkspaceToRoleByUser(2);
    $expectation = [];
    static::assertEquals($expectation, $result);

    $result = $this->dbc->getMapWorkspaceToRoleByUser(33);
    $expectation = [];
    static::assertEquals($expectation, $result);
  }

  public function test_setWorkspaceRightsByUser() {
    $this->dbc->setWorkspaceRightsByUser(1, [
      (object) ['id' => '1', 'role' => 'XX'],
    ]);

    $result = $this->dbc->getMapWorkspaceToRoleByUser(1);
    $expectation = [
      1 => 'XX'
    ];
    static::assertEquals($expectation, $result);
  }

  public function test_setPassword() {
    $this->dbc->setPassword(1, "new_password");

    $result = $this->dbc->checkPassword(1, "wrong_password");
    static::assertNotNull(false, $result);

    $result = $this->dbc->checkPassword(1, "new_password");
    static::assertNotNull(true, $result);
  }

  public function test_addUser() {
    $result = $this->dbc->createUser("a_third_user", "some_password");
    $expectation = [
      "id" => "3",
      "name" => "a_third_user",
      "email" => null,
      "isSuperadmin" => false
    ];
    static::assertEquals($expectation, $result);

    $result2 = $this->dbc->getUserByName("a_third_user");
    static::assertEquals($expectation, $result2);

    $this->expectException('HttpError');
    $this->dbc->createUser("a_third_user", "again");
  }

  public function test_renameWorkspace() {
    $this->dbc->setWorkspaceName(1, 'new_name');
    $result = $this->dbc->_('select name from workspaces where id = 1')['name'];
    $expectation = 'new_name';
    static::assertEquals($expectation, $result);

    $this->dbc->createWorkspace('another_workspace');

    try {
      $this->dbc->setWorkspaceName(1, 'another_workspace');
      static::fail("Exception expected.");
    } catch (HttpError $exception) {
      static::assertEquals(409, $exception->getCode());
    }

    $this->expectException('HttpError');
    $this->dbc->setWorkspaceName(33, 'new_name');
  }

  public function test_deleteWorkspaces() {
    $this->dbc->deleteWorkspaces([1]);
    $result = $this->dbc->getWorkspaces();
    static::assertEquals([], $result);
  }

  public function test_getUsersByWorkspace() {
    $result = $this->dbc->getUsersByWorkspace(1);
    $expectation = [
      [
        'id' => '2',
        'name' => 'i_exist_but_am_not_allowed_anything',
        'selected' => false,
        'role' => ''
      ],
      [
        'id' => '1',
        'name' => 'super',
        'selected' => true,
        'role' => 'RW'
      ]
    ];
    static::assertEquals($expectation, $result);
  }

  public function test_getWorkspaceRolesPerUser() {
    $result = $this->dbc->getMapUserToRoleByWorkspace(1);
    $expectation = [
      1 => 'RW'
    ];
    static::assertEquals($expectation, $result);

    $result = $this->dbc->getMapWorkspaceToRoleByUser(33);
    $expectation = [];
    static::assertEquals($expectation, $result);
  }

  public function test_setUserRightsForWorkspace() {
    $this->dbc->setUserRightsForWorkspace(1, [
      (object) ['id' => '1', 'role' => 'RO'],
      (object) ['id' => '2', 'role' => 'MO']
    ]);

    $result = $this->dbc->getMapUserToRoleByWorkspace(1);
    $expectation = [
      1 => 'RO',
      2 => 'MO'
    ];
    static::assertEquals($expectation, $result);
  }

  public function test_setSuperAdminStatus() {
    $this->dbc->setSuperAdminStatus(2, true);

    $result = $this->dbc->getUserByName("i_exist_but_am_not_allowed_anything");
    $expectation = [
      "id" => "2",
      "name" => "i_exist_but_am_not_allowed_anything",
      "email" => null,
      "isSuperadmin" => true
    ];
    static::assertEquals($expectation, $result);

    $this->dbc->setSuperAdminStatus(2, false);

    $result = $this->dbc->getUserByName("i_exist_but_am_not_allowed_anything");
    $expectation = [
      "id" => "2",
      "name" => "i_exist_but_am_not_allowed_anything",
      "email" => null,
      "isSuperadmin" => false
    ];
    static::assertEquals($expectation, $result);
  }

  public function test_createWorkspace() {
    $expectation = [
      "id" => 2,
      "name" => 'new_workspace'
    ];
    $result = $this->dbc->createWorkspace('new_workspace');
    static::assertEquals($expectation, $result);

    try {
      $this->dbc->createWorkspace('new_workspace');
      static::fail("Exception expected.");
    } catch (HttpError $exception) {
      static::assertEquals($exception->getCode(), 409);
    }

    $result = $this->dbc->getWorkspaces();
    $expectation = [
      [
        "id" => 1,
        "name" => "example_workspace",
        "latest_modification_ts" => "2023-01-16 09:00:00"
      ],
      [
        "id" => 2,
        "name" => "new_workspace",
        "latest_modification_ts" => null
      ],

    ];
    static::assertEquals($expectation, $result);
  }

  public function test_getOrCreateWorkspace() {
    $result = $this->dbc->getOrCreateWorkspace("example_workspace");
    $expectation = [
      "id" => 1,
      "name" => "example_workspace"
    ];
    static::assertEquals($expectation, $result);

    $result = $this->dbc->getOrCreateWorkspace("new_workspace");
    $expectation = [
      "id" => 2,
      "name" => "new_workspace"
    ];
    static::assertEquals($expectation, $result);
  }
}
