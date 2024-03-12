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
    require_once "test/unit/TestDB.class.php";

    TestDB::setUp();
    $this->dbc = new WorkspaceDAO(1, '/data_dir/ws_1');
    $this->dbc->runFile(ROOT_DIR . '/backend/test/unit/testdata.sql');
  }

  public function test_getGlobalIds(): void {
    $expectation = [
      1 => [
        'testdata.sql' => [
          'login' => ['future_user', 'monitor', 'sample_user', 'test', 'test-expired'],
          'group' => ['sample_group']
        ],
        '/name/' => 'example_workspace'
      ]
    ];
    $result = $this->dbc->getGlobalIds();
    $this->assertEquals($expectation, $result);
  }

  public function test_getWorkspaceName(): void {
    $result = $this->dbc->getWorkspaceName(1);
    $expectation = 'example_workspace';
    $this->assertEquals($expectation, $result);
  }

  // TODO make a test for adding
  public function test_storeFileMeta_overwrite(): void {
    $file = XMLFileBooklet::fromString('<Booklet><Metadata><Id>BOOKLET.SAMPLE-1</Id><Label>l</Label></Metadata><Units><Unit label="l" id="x_unit" /></Units></Booklet>', 'Booklet.xml');

    $this->dbc->storeFile($file);
    $files = $this->dbc->_("select *, 'ignore' as validation_report from files where type = 'Booklet'", [], true);
    $expectation = [
      [
        'workspace_id' => 1,
        'name' => 'Booklet-no-test.xml',
        'id' => 'BOOKLET.NO.TEST',
        'version_mayor' => null,
        'version_minor' => null,
        'version_patch' => null,
        'version_label' => null,
        'label' => 'Booklet without test',
        'description' => 'No test yet',
        'type' => 'Booklet',
        'verona_module_type' => null,
        'verona_version' => null,
        'verona_module_id' => null,
        'is_valid' => 0,
        'validation_report' => 'ignore',
        'modification_ts' => '2023-01-16 09:00:00',
        'size' => 195,
        'context_data' => null
      ],
      [
        'workspace_id' => 1,
        'name' => 'Booklet.xml',
        'id' => 'BOOKLET.SAMPLE-1',
        'version_mayor' => 0,
        'version_minor' => 0,
        'version_patch' => 0,
        'version_label' => '',
        'label' => 'l',
        'description' => '',
        'type' => 'Booklet',
        'verona_module_type' => '',
        'verona_version' => '',
        'verona_module_id' => '',
        'is_valid' => 1,
        'validation_report' => 'ignore',
        'modification_ts' => '1970-01-01 01:00:01',
        'size' => 0,
        'context_data' => 'a:0:{}'
      ]
    ];
    $this->assertEquals($expectation, $files);
  }

  public function test_addLoginSource(): void {
    $logins = new LoginArray(
      new Login('first', 'some', 'run-hot-return', 'grp', 'Grp', [], 1, 1000000, 200000, 0, (object) ['some' => 'thing']),
      new Login('second', 'thing', 'run-hot-return', 'grp', 'Grp', [], 1, 1000000, null, 0, (object) ['some' => 'thing']),
      new Login('else', 'thing', 'run-hot-return', 'grp', 'Grp', [], 1, null, 200000, 10),
      new Login('evil\'; select * from users; characters"  ', 'thing', 'run-hot-return', 'grp', 'Grp', [], 1, 1000000, 200000, 0, (object) ['some \' evil' => 'thing'])
    );
    $this->dbc->addLoginSource('unit-test', $logins);
    $insertedLogins = $this->dbc->_("select count(*) as count from logins where source='unit-test'")['count'];
    $this->assertEquals(4, $insertedLogins);
  }
}
