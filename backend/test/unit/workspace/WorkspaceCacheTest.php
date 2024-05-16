<?php

/** @noinspection PhpIllegalPsrClassPathInspection */

declare(strict_types=1);

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;

function paf_log($x) {}

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
    $this->workspaceCache->loadAllFiles();
  }

  function test_validate() {
    $this->workspaceCache->validate();

    $allReports = [];
    foreach ($this->workspaceCache->getFiles(true) as $file) {
      /* @var File $file ; */
      $allReports["{$file->getType()}/{$file->getName()}"] = $file->getValidationReport();
    }

    $version = SystemConfig::$system_version;

    $expected = [
      'Testtakers/testtakers-duplicate-login-name.xml' => [
        'error' => ["Error [1877] in line 2: Element 'Login': Duplicate key-sequence ['duplicate_login'] in unique identity-constraint 'TesttakerLogin'."],
        'warning' => ["File has no link to XSD-Schema. Current version (`$version`) will be used instead."]
      ],
      'Testtakers/testtakers-missing-booklet.xml' => [
        'error' => ['Booklet `BOOKLET.MISSING` not found for login `a_login`'],
        'warning' => ["File has no link to XSD-Schema. Current version (`$version`) will be used instead."]
      ],
      'Testtakers/trash.xml' => [
        'error' => ['Invalid root-tag: `Trash`'],
      ],
      'Testtakers/testtakers-broken.xml' => [
        'error' => [
          'Error [76] in line 6: Opening and ending tag mismatch: Testtakers line 2 and Metadata',
          'Error [5] in line 8: Extra content at the end of the document'
        ]
      ],
      'Booklet/trash.xml' => [
        'warning' => ['Booklet is never used'],
        'error' => ['Invalid root-tag: `Trash`'],
      ],
      'Booklet/booklet-broken.xml' => [
        'warning' => ['Booklet is never used'],
        'error' => [
          'Error [76] in line 32: Opening and ending tag mismatch: Booklet line 2 and Units',
          'Error [5] in line 33: Extra content at the end of the document'
        ],
      ],
      'Booklet/booklet-duplicate-id-1.xml' => [
        'error' => ['Duplicate Booklet-Id: `DUPLICATE_BOOKLET_ID` (booklet-duplicate-id-2.xml)'],
        'warning' => [
          "File has no link to XSD-Schema. Current version (`$version`) will be used instead.",
          'Booklet is never used'
        ],
      ],
      'Booklet/booklet-duplicate-id-2.xml' => [
        'warning' => [
          "File has no link to XSD-Schema. Current version (`$version`) will be used instead.",
          'Booklet is never used'
        ],
      ],
      'Unit/unit-unused-and-missing-player.xml' => [
        'warning' => [
          "File has no link to XSD-Schema. Current version (`$version`) will be used instead.",
          'Unit is never used'
        ],
        'error' => ['Player `MISSING-P-0.0` not found'],
      ],
      'Unit/unit-unused-and-missing-ref.xml' => [
        'warning' => [
          "File has no link to XSD-Schema. Current version (`$version`) will be used instead.",
          'Unit is never used'
        ],
        'error' => [
          'Unit-Definition `not-existing.voud` not found',
          'Player `SAMPLE_P-0.0` not found'
        ]
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
        'warning' => ["File has no link to XSD-Schema. Current version (`$version`) will be used instead."]
      ],
      'Testtakers/testtakers-duplicate-login-name-cross-file-2.xml' => [
        'error' => ["Duplicate login: `double_login` - also in file `testtakers-duplicate-login-name-cross-file-1.xml`"],
        'warning' => ["File has no link to XSD-Schema. Current version (`$version`) will be used instead."]
      ],
      'Testtakers/testtakers-duplicate-login-name-cross-ws.xml' => [
        'error' => [
          "Duplicate login: `another_login` - also on workspace `other_sample_workspace` in file `testtakers-duplicate-login-name-cross-ws.xml`",
          "Duplicate group: `another_group` - also on workspace `other_sample_workspace` in file `testtakers-duplicate-login-name-cross-ws.xml`"
        ],
        'warning' => ["File has no link to XSD-Schema. Current version (`$version`) will be used instead."]
      ],
      'Resource/verona-player-simple-4.0.0.html' => [
        'info' => ['Verona-Version: 4.0'],
        'warning' => ['Non-Standard-Filename: `verona-player-simple-4.0.html` expected.']
      ],
      'Resource/sample_resource_package.itcr.zip' => [
        'info' => ['Contains 0 files.']
      ],
      'Resource/SAMPLE_UNITCONTENTS.HTM' => [],
      'Booklet/SAMPLE_BOOKLET3.XML' => [],
      'Booklet/SAMPLE_BOOKLET2.XML' => [],
      'Booklet/SAMPLE_BOOKLET.XML' => [],
      'Testtakers/SAMPLE_TESTTAKERS.XML' => [],
      'SysCheck/SAMPLE_SYSCHECK.XML' => [],
    ];

    $this->assertEquals($expected, $allReports);
  }

  function test_getResource(): void  {
    $result = $this->workspaceCache->getResource('VERONA-PLAYER-SIMPLE-4.0');
    $expectation = "verona-player-simple-4.0.0.html";
    $this->assertEquals($expectation, $result->getName());

    $result = $this->workspaceCache->getResource('missing_player.html');
    $this->assertNull($result);

    // more scenarios are implicitly tested with test_getPlayerIfExists in XMLFilesUnitTest
  }

  function test_getRelatingFiles_booklet(): void {
    $file = new XMLFileBooklet(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML');
    $this->workspaceCache->validate();
    $result = $this->workspaceCache->getRelatingFiles($file);
    $expectation = ['Testtakers/SAMPLE_TESTTAKERS.XML' ];
    $this->assertEquals($expectation, array_keys($result));
  }

  function test_getRelatingFiles_unit(): void {
    $file = new XMLFileUnit(DATA_DIR . '/ws_1/Unit/SAMPLE_UNIT.XML');
    $this->workspaceCache->validate();
    $result = $this->workspaceCache->getRelatingFiles($file);
    $expectation = [
      'Booklet/booklet-duplicate-id-2.xml',
      'Booklet/SAMPLE_BOOKLET3.XML',
      'Testtakers/SAMPLE_TESTTAKERS.XML',
      'Booklet/SAMPLE_BOOKLET2.XML',
      'Booklet/SAMPLE_BOOKLET.XML',
      'SysCheck/SAMPLE_SYSCHECK.XML'
    ];
    $this->assertEquals($expectation, array_keys($result));
  }

  function test_getRelatingFiles_resource(): void {
    $file = new ResourceFile(DATA_DIR . '/ws_1/Resource/sample_resource_package.itcr.zip');
    $this->workspaceCache->validate();
    $result = $this->workspaceCache->getRelatingFiles($file);
    $expectation = [
      'Unit/SAMPLE_UNIT2.XML',
      'Booklet/SAMPLE_BOOKLET3.XML',
      'Testtakers/SAMPLE_TESTTAKERS.XML',
      'Booklet/SAMPLE_BOOKLET2.XML',
      'Booklet/SAMPLE_BOOKLET.XML'
    ];
    $this->assertEquals($expectation, array_keys($result));
  }


  function test_getRelatingFiles_twoFiles(): void {
    $booklet = new XMLFileBooklet(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML');
    $unit = new XMLFileUnit(DATA_DIR . '/ws_1/Unit/SAMPLE_UNIT.XML');
    $this->workspaceCache->validate();
    $result = $this->workspaceCache->getRelatingFiles($booklet, $unit);
    $expectation = [
      'Booklet/booklet-duplicate-id-2.xml',
      'Booklet/SAMPLE_BOOKLET3.XML',
      'Testtakers/SAMPLE_TESTTAKERS.XML',
      'Booklet/SAMPLE_BOOKLET2.XML',
      'Booklet/SAMPLE_BOOKLET.XML',
      'SysCheck/SAMPLE_SYSCHECK.XML'
    ];
    $this->assertEquals($expectation, array_keys($result));
  }

  function test_getRelatingFiles_FilesFromDB(): void {
    $file = new XMLFileUnit(new FileData(
      DATA_DIR . '/ws_1/Unit/SAMPLE_UNIT.XML',
      'Unit',
      'UNIT.SAMPLE',
      'A sample unit',
      'This is a sample unit showing the possibilities of the sample player.',
      true,
      [],
      [
        new FileRelation(
          'Resource',
          'verona-player-simple-4.0.0.html',
          FileRelationshipType::isDefinedBy,
          'SAMPLE_UNITCONTENTS.HTM'
        ),
        new FileRelation(
          'Resource',
          'SAMPLE_UNITCONTENTS.HTM',
          FileRelationshipType::usesPlayer,
          'VERONA-PLAYER-SIMPLE-4.0'
        ),
      ]
    ));
    $this->workspaceCache->validate();
    $result = $this->workspaceCache->getRelatingFiles($file);
    $expectation = [
      'Booklet/booklet-duplicate-id-2.xml',
      'Booklet/SAMPLE_BOOKLET3.XML',
      'Testtakers/SAMPLE_TESTTAKERS.XML',
      'Booklet/SAMPLE_BOOKLET2.XML',
      'Booklet/SAMPLE_BOOKLET.XML',
      'SysCheck/SAMPLE_SYSCHECK.XML'
    ];
    $this->assertEquals($expectation, array_keys($result));
  }
}
