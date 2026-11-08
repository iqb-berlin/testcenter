<?php
declare(strict_types=1);
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
    $this->dbc->storeFile(new ResourceFile(new FileData(
      path: '/data_dir/ws_1/Resource/periodic-system-select-widget-1.1.html',
      type: 'Resource',
      id: 'PERIODIC-SYSTEM-SELECT-WIDGET-1.1',
      veronaModuleType: 'widget',
      veronaModuleId: 'periodic-system-select-widget',
      veronaModel: 'PERIODIC_TABLE'
    )));

    $stored = $this->dbc->getFileById('PERIODIC-SYSTEM-SELECT-WIDGET-1.1', 'Resource');

    static::assertEquals('widget', $stored->getVeronaModuleType());
    static::assertEquals('PERIODIC_TABLE', $stored->getVeronaModel());
  }

  public function test_getWidgets(): void {
    $storeWidget = function (string $name, string $model, int $major, int $minor, array $errors = []): void {
      $this->dbc->storeFile(new ResourceFile(new FileData(
        path: "/data_dir/ws_1/Resource/$name",
        type: 'Resource',
        id: strtoupper($name),
        label: "Label of $name",
        validationReport: ['error' => $errors],
        veronaModuleType: 'widget',
        veronaModuleId: $model,
        versionMayor: $major,
        versionMinor: $minor,
        veronaModel: $model
      )));
    };
    $storeWidget('periodic-1.9.html', 'PERIODIC_TABLE', 1, 9);
    $storeWidget('periodic-1.10.html', 'PERIODIC_TABLE', 1, 10);
    $storeWidget('periodic-2.0.html', 'PERIODIC_TABLE', 2, 0, ['an error']);
    $storeWidget('molecules-1.0.html', 'MOLECULE_EDITOR', 1, 0);
    $this->dbc->storeFile(new ResourceFile(new FileData(
      path: '/data_dir/ws_1/Resource/iqb-player-aspect-3.1.html',
      type: 'Resource',
      id: 'IQB-PLAYER-ASPECT-3.1',
      veronaModuleType: 'player',
      veronaModel: 'aspect-unit-definition@>=4.0 <=4.13'
    )));

    static::assertEquals(
      [
        'MOLECULE_EDITOR' => ['path' => 'Resource/molecules-1.0.html', 'label' => 'Label of molecules-1.0.html'],
        'PERIODIC_TABLE' => ['path' => 'Resource/periodic-1.10.html', 'label' => 'Label of periodic-1.10.html']
      ],
      $this->dbc->getWidgets()
    );
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
