<?php

/** @noinspection PhpIllegalPsrClassPathInspection */

declare(strict_types=1);

use org\bovigo\vfs\vfsStreamDirectory;
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
    require_once "test/unit/mock-classes/ZIPMock.php";

    $workspaceDaoMock = Mockery::mock('overload:' . WorkspaceDAO::class);
    $workspaceDaoMock->allows([
      'getGlobalIds' => VfsForTest::globalIds
    ]);
    VfsForTest::setUp(true);
    $this->workspaceCache = new WorkspaceCache(new Workspace(1));
    $this->workspaceCache->loadFiles();
  }

  function test_validate() {
    $this->workspaceCache->validate();

    $allReports = [];
    foreach ($this->workspaceCache->getFiles(true) as $file) {
      /* @var File $file ; */
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
          'File has no link to XSD-schema.',
          'Duplicate Booklet-Id: `DUPLICATE_BOOKLET_ID` (booklet-duplicate-id-2.xml)'
        ],
        'warning' => ['Booklet is never used'],
      ],
      'Booklet/booklet-duplicate-id-2.xml' => [
        'error' => ['File has no link to XSD-schema.'],
        'warning' => ['Booklet is never used'],
      ],
      'Unit/unit-unused-and-missing-player.xml' => [
        'error' => ['Player not found `MISSING-P-0.0`.'],
        'warning' => ['Unit is never used'],
      ],
      'Unit/unit-unused-and-missing-ref.xml' => [
        'error' => [
          'File has no link to XSD-schema.',
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
        'info' => ['Contains 0 files.']
      ],
      'Resource/SAMPLE_UNITCONTENTS.HTM' => [],
      "Resource/coding-scheme.vocs.json" => [],
      'Booklet/SAMPLE_BOOKLET3.XML' => [],
      'Booklet/SAMPLE_BOOKLET2.XML' => [],
      'Booklet/SAMPLE_BOOKLET.XML' => [],
      'Testtakers/SAMPLE_TESTTAKERS.XML' => [],
      'SysCheck/SAMPLE_SYSCHECK.XML' => [],
    ];

    $this->assertEquals($expected, $allReports);
  }

  function test_getResource() {
    $result = $this->workspaceCache->getResource('VERONA-PLAYER-SIMPLE-6.0');
    $expectation = "verona-player-simple-6.0.html";
    $this->assertEquals($expectation, $result->getName());

    $result = $this->workspaceCache->getResource('missing_player.html');
    $this->assertNull($result);

    // more scenarios are implicitly tested with test_getPlayerIfExists in XMLFilesUnitTest
  }
}