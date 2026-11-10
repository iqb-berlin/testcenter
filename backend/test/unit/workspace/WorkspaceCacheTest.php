<?php

/** @noinspection PhpIllegalPsrClassPathInspection */

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class WorkspaceCacheTest extends TestCase {
  private WorkspaceCache $workspaceCache;

  public static function setUpBeforeClass(): void {
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
  }

  function setUp(): void {
    require_once "test/unit/mock-classes/ExternalFileMock.php";
    require_once "test/unit/mock-classes/PasswordMock.php";

    $workspaceDaoMock = Mockery::mock('overload:' . WorkspaceDAO::class);
    $workspaceDaoMock->allows([
      'getGlobalIds' => VfsForTest::globalIds
    ]);
    SystemConfig::$xmlSchema_validation = true;
    VfsForTest::setUp(true);
    $this->workspaceCache = new WorkspaceCache(new Workspace(1));
    $this->workspaceCache->loadFiles();
  }

  function test_validate() {
    $this->workspaceCache->validate();

    $allReports = [];
    /** @var File $file */
    foreach ($this->workspaceCache->getFiles(true) as $file) {
      $allReports["{$file->getType()}/{$file->getName()}"] = $file->getValidationReport();
    }

    $expected = [
      'Testtakers/testtakers-duplicate-login-name.xml' => [
        'error' => ["Error [1877] in line 2: Element 'Login': Duplicate key-sequence ['duplicate_login'] in unique identity-constraint 'TesttakerLogin'."],
      ],
      'Testtakers/testtakers-missing-booklet.xml' => [
        'error' => ['Booklet `BOOKLET.MISSING` not found for login `a_login`'],
      ],
      'Testtakers/trash.xml' => [
        'error' => ['Invalid root-tag: `Trash`'],
      ],
      'Testtakers/testtakers-broken.xml' => [
        'error' => [
          'Error [76] in line 7: Opening and ending tag mismatch: Testtakers line 2 and Metadata',
          'Error [5] in line 9: Extra content at the end of the document'
        ]
      ],
      'Booklet/trash.xml' => [
        'warning' => ['Booklet is never used'],
        'error' => ['Invalid root-tag: `Trash`'],
      ],
      'Booklet/booklet-broken.xml' => [
        'warning' => ['Booklet is never used'],
        'error' => [
          'Error [76] in line 33: Opening and ending tag mismatch: Booklet line 2 and Units',
          'Error [5] in line 34: Extra content at the end of the document'
        ],
      ],
      'Booklet/booklet-duplicate-id-1.xml' => [
        'error' => [
          'File has no link to XSD-schema. Expected a schema URL like `https://w3id.org/iqb/spec/testcenter-booklet-xml/<version>` with major version 18 to 18.',
          'Duplicate Booklet-Id: `DUPLICATE_BOOKLET_ID` (booklet-duplicate-id-2.xml)'
        ],
        'warning' => ['Booklet is never used'],
      ],
      'Booklet/booklet-duplicate-id-2.xml' => [
        'error' => ['File has no link to XSD-schema. Expected a schema URL like `https://w3id.org/iqb/spec/testcenter-booklet-xml/<version>` with major version 18 to 18.'],
        'warning' => ['Booklet is never used'],
      ],
      'Unit/unit-unused-and-missing-player.xml' => [
        'error' => ['Player not found `MISSING-P-0.0`.'],
        'warning' => ['Unit is never used'],
      ],
      'Unit/unit-unused-and-missing-ref.xml' => [
        'error' => [
          'File has no link to XSD-schema. Expected a schema URL like `https://w3id.org/iqb/spec/unit-xml/<version>` with major version 17 to 17.',
          'Resource `not-existing.voud` not found'
        ],
        'warning' => ['Unit is never used'],
      ],
      'Unit/SAMPLE_UNIT.XML' => [
        'info' => ["`1` attachment(s) requested."]
      ],
      'Unit/SAMPLE_UNIT2.XML' => [
        'warning' => ["Element `/Unit/Definition/@type` is deprecated."]
      ],
      'Resource/resource-unused.voud' => [
        'warning' => ['Resource is never used'],
      ],
      'Testtakers/testtakers-duplicate-login-name-cross-file-1.xml' => [
        'error' => ["Duplicate login: `double_login` - also in file `testtakers-duplicate-login-name-cross-file-2.xml`"],
      ],
      'Testtakers/testtakers-duplicate-login-name-cross-file-2.xml' => [
        'error' => ["Duplicate login: `double_login` - also in file `testtakers-duplicate-login-name-cross-file-1.xml`"],
      ],
      'Testtakers/testtakers-duplicate-login-name-cross-ws.xml' => [
        'error' => [
          "Duplicate login: `another_login` - also on workspace `other_sample_workspace` in file `testtakers-duplicate-login-name-cross-ws.xml`",
          "Duplicate group: `another_group` - also on workspace `other_sample_workspace` in file `testtakers-duplicate-login-name-cross-ws.xml`"
        ],
      ],
      'Resource/verona-player-simple-6.0.html' => [
        'info' => ['Verona-Version: 6.0'],
        'warning' => ['Resource is never used']
      ],
      'Resource/sample_resource_package.itcr.zip' => [
        'info' => ['Contains 1 files.']
      ],
      'Resource/SAMPLE_UNITCONTENTS.HTM' => [],
      "Resource/coding-scheme.vocs.json" => [],
      'Booklet/SAMPLE_BOOKLET3.XML' => [],
      'Booklet/SAMPLE_BOOKLET2.XML' => [],
      'Booklet/SAMPLE_BOOKLET.XML' => [],
      'Testtakers/SAMPLE_TESTTAKERS.XML' => [],
      'SysCheck/SAMPLE_SYSCHECK.XML' => [],
    ];

    static::assertEquals($expected, $allReports);
  }

  function test_validate_passwordRequired() {
    SystemConfig::$login_requirePassword = true;
    $this->workspaceCache->validate();

    $report = $this->workspaceCache->getFile('Testtakers', 'SAMPLE_TESTTAKERS.XML')->getValidationReport();

    $expected = [
      'error' => [
        'Login `test-no-pw` has no password, but passwords are required on this instance',
        'Login `test-no-pw-trial` has no password, but passwords are required on this instance',
        'Login `test-expired` has no password, but passwords are required on this instance',
        'Login `test-future` has no password, but passwords are required on this instance'
      ]
    ];
    static::assertEquals($expected, $report);
  }

  function test_getResource() {
    $result = $this->workspaceCache->getResource('VERONA-PLAYER-SIMPLE-6.0');
    $expectation = "verona-player-simple-6.0.html";
    static::assertEquals($expectation, $result->getName());

    $result = $this->workspaceCache->getResource('missing_player.html');
    static::assertNull($result);

    // more scenarios are implicitly tested with test_getPlayerIfExists in XMLFilesUnitTest
  }

  function test_validate_allowsOnlyOneWidgetPerModel() {
    $periodic11 = $this->addWidget('periodic-1.1.html', 'periodic', '1.1.0', 'PERIODIC_TABLE');
    $periodic12 = $this->addWidget('periodic-1.2.html', 'periodic', '1.2.0', 'PERIODIC_TABLE');
    $molecules = $this->addWidget('molecules-1.0.html', 'molecules', '1.0.0', 'MOLECULE_EDITOR');
    $otherPeriodic = $this->addWidget('other-periodic-2.0.html', 'other-periodic', '2.0.0', 'PERIODIC_TABLE');

    $this->workspaceCache->validate();

    $error = 'Only one widget per model allowed: `periodic`, `other-periodic` are all widgets for `PERIODIC_TABLE`.';
    foreach ([$periodic11, $periodic12, $otherPeriodic] as $widget) {
      static::assertEquals([$error], $widget->getValidationReport()['error'], $widget->getName());
    }
    static::assertTrue($molecules->isValid(), 'widgets for other models are fine');
    static::assertTrue(
      $this->workspaceCache->getResource('VERONA-PLAYER-SIMPLE-6.0')->isValid(),
      'other resources are not affected'
    );
  }

  function test_validate_allowsVersionsOfTheSameWidget() {
    $periodic11 = $this->addWidget('periodic-1.1.html', 'periodic', '1.1.0', 'PERIODIC_TABLE');
    $periodic12 = $this->addWidget('periodic-1.2.html', 'periodic', '1.2.0', 'PERIODIC_TABLE');

    $this->workspaceCache->validate();

    static::assertTrue($periodic11->isValid());
    static::assertTrue($periodic12->isValid());
  }

  function test_validate_ignoresWidgetsInvalidForOtherReasons() {
    $periodic = $this->addWidget('periodic-1.1.html', 'periodic', '1.1.0', 'PERIODIC_TABLE');
    $this->addWidget('future-periodic-1.0.html', 'future-periodic', '1.0.0', 'PERIODIC_TABLE', '2.0');

    $this->workspaceCache->validate();

    static::assertTrue($periodic->isValid());
  }

  private function addWidget(
    string $fileName,
    string $id,
    string $version,
    string $model,
    string $specVersion = '1.0'
  ): ResourceFile {
    $metadata = json_encode([
      'type' => 'WIDGET',
      'id' => $id,
      'name' => [['lang' => 'de', 'value' => $id]],
      'version' => $version,
      'specVersion' => $specVersion,
      'metadataVersion' => '3.1',
      'model' => $model
    ], JSON_THROW_ON_ERROR);
    file_put_contents(
      DATA_DIR . "/ws_1/Resource/{$fileName}",
      "<html lang='de'><head><script type='application/ld+json'>{$metadata}</script></head></html>"
    );
    $widget = new ResourceFile(StoragePath::fromString("ws_1/Resource/{$fileName}"));
    $this->workspaceCache->addFile('Resource', $widget);
    return $widget;
  }
}
