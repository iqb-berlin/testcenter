<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;

require_once "test/unit/test-helper/AssertsArraysIgnoringOrder.php";

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class WorkspaceDAOTest extends TestCase {
  use AssertsArraysIgnoringOrder;

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
    // getGlobalIds() queries without `order by`, so neither the ids nor the keys have a fixed order
    $this->assertSameIgnoringOrder($expectation, $result);
  }

  public function test_getWorkspaceName(): void {
    $result = $this->dbc->getWorkspaceName(1);
    $expectation = 'example_workspace';
    static::assertEquals($expectation, $result);
  }

  // TODO make a test for adding
  public function test_storeFileMeta_overwrite(): void {
    SystemConfig::$xmlSchema_validation = true;
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
        'verona_model' => '',
        'is_valid' => false,
        'validation_report' => 'ignore',
        'modification_ts' => '2023-01-16 08:00:00+00',
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
        'verona_model' => '',
        'is_valid' => false,
        'validation_report' => 'ignore',
        'modification_ts' => '1970-01-01 00:00:01+00',
        'size' => 0,
        'context_data' => 'a:0:{}'
      ]
    ];
    static::assertEquals($expectation, $files);
  }

  public function test_storeAndRestoreVeronaModel(): void {
    $file = new ResourceFile(new FileData(
      path: '/data_dir/ws_1/Resource/widget.html',
      type: 'Resource',
      id: 'WIDGET-1.0',
      veronaModuleType: 'widget',
      veronaModuleId: 'widget',
      veronaModel: 'MOLECULE_EDITOR'
    ));
    $this->dbc->storeFile($file);
    $stored = $this->dbc->getFileById('WIDGET-1.0', 'Resource');
    $this->assertNotNull($stored);
    $this->assertSame('widget', $stored->getVeronaModuleType());
    $this->assertSame('MOLECULE_EDITOR', $stored->getVeronaModel());
    $this->assertSame('MOLECULE_EDITOR', $stored->jsonSerialize()['info']['veronaModel']);

    $replacement = new ResourceFile(new FileData(
      path: '/data_dir/ws_1/Resource/widget.html', type: 'Resource', id: 'WIDGET-1.0'
    ));
    $this->dbc->storeFile($replacement);
    $this->assertSame('', $this->dbc->getFileById('WIDGET-1.0', 'Resource')->getVeronaModel());
  }

  public function test_getWidgetResourcesFiltersCandidates(): void {
    foreach ([
      ['widget.html', 'Resource', 'widget', 'PERIODIC_TABLE', true],
      ['player.html', 'Resource', 'player', 'PERIODIC_TABLE', true],
      ['invalid.html', 'Resource', 'widget', 'PERIODIC_TABLE', false],
      ['missing-model.html', 'Resource', 'widget', '', true],
      ['unit.xml', 'Unit', 'widget', 'PERIODIC_TABLE', true]
    ] as [$name, $type, $moduleType, $model, $valid]) {
      $file = File::get(new FileData(
        path: "/data_dir/ws_1/$type/$name",
        type: $type,
        id: $name,
        isValid: $valid,
        validationReport: $valid ? [] : ['error' => ['Invalid widget']],
        veronaModuleType: $moduleType,
        veronaModel: $model
      ));
      $this->dbc->storeFile($file);
    }
    $this->dbc->_("INSERT INTO workspaces (id, name, workspace_hash, content_type) VALUES (2, 'other', '', 'mixed')");
    $this->dbc->_(
      "INSERT INTO files (workspace_id, name, id, type, verona_module_type, verona_model, is_valid, size)
       VALUES (2, 'other-workspace.html', 'other-workspace', 'Resource', 'widget', 'PERIODIC_TABLE', true, 0)"
    );

    $this->assertSame([
      ['name' => 'widget.html', 'verona_model' => 'PERIODIC_TABLE']
    ], $this->dbc->getWidgetResources());
  }

  public function test_getWidgetResourcesHasDeterministicOrder(): void {
    foreach ([
      ['z-oldest.html', 'PERIODIC_TABLE', 100],
      ['z-newest.html', 'PERIODIC_TABLE', 200],
      ['a-newest.html', 'PERIODIC_TABLE', 200],
      ['molecule.html', 'MOLECULE_EDITOR', 300],
      ['lowercase.html', 'periodic_table', 100]
    ] as [$name, $model, $time]) {
      $this->dbc->storeFile(new ResourceFile(new FileData(
        path: "/data_dir/ws_1/Resource/$name",
        type: 'Resource',
        id: $name,
        modificationTime: $time,
        veronaModuleType: 'widget',
        veronaModel: $model
      )));
    }
    $expected = [
      ['name' => 'molecule.html', 'verona_model' => 'MOLECULE_EDITOR'],
      ['name' => 'z-oldest.html', 'verona_model' => 'PERIODIC_TABLE'],
      ['name' => 'a-newest.html', 'verona_model' => 'PERIODIC_TABLE'],
      ['name' => 'z-newest.html', 'verona_model' => 'PERIODIC_TABLE'],
      ['name' => 'lowercase.html', 'verona_model' => 'periodic_table']
    ];
    $this->assertSame($expected, $this->dbc->getWidgetResources());
    $this->assertSame($expected, $this->dbc->getWidgetResources());
  }

  public function test_addLoginSource(): void {
    $logins = new LoginArray(
      new Login('first', 'some', 'run-hot-return', 'grp', 'Grp', [], 1, 1000000, 200000, 0, (object) ['some' => 'thing']),
      new Login('second', 'thing', 'run-hot-return', 'grp', 'Grp', [], 1, 1000000, 0, 0, (object) ['some' => 'thing']),
      new Login('else', 'thing', 'run-hot-return', 'grp', 'Grp', [], 1, 0, 200000, 10),
      new Login('evil\'; select * from users; characters"  ', 'thing', 'run-hot-return', 'grp', 'Grp', [], 1, 1000000, 200000, 0, (object) ['some \' evil' => 'thing'])
    );
    $this->dbc->addLoginSource('unit-test', $logins);
    $insertedLogins = $this->dbc->_("select count(*) as count from logins where source='unit-test'")['count'];
    static::assertEquals(4, $insertedLogins);
  }
}
