<?php
/** @noinspection PhpIllegalPsrClassPathInspection */

use Mockery\MockInterface;
use org\bovigo\vfs\vfsStream;
use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class WorkspaceTest extends TestCase {
  private vfsStreamDirectory $vfs;
  private WorkspaceDAO|MockInterface $workspaceDaoMock;

  const validFile = '<Unit ><Metadata><Id>id</Id><Label>l</Label></Metadata><Definition player="p">1st valid file</Definition></Unit>';
  const invalidFile = '<Unit><Metadata><Id>id</Id></Metadata></Unit>';
  const validFile2 = '<Unit><Metadata><Id>id</Id><Label>l</Label></Metadata><Definition player="p">2nd valid file</Definition></Unit>';

  const validUnit =
    '<Unit ><Metadata><Id>x_unit</Id><Label>l</Label></Metadata><Definition player="p">valid extracted unit</Definition></Unit>';
  const validBooklet =
    '<Booklet><Metadata><Id>x_booklet</Id><Label>l</Label></Metadata><Units><Unit label="l" id="x_unit" /></Units></Booklet>';
  const validTesttakers =
    '<Testtakers>
        <Metadata><Description>d</Description></Metadata>
        <Group id="new_group" label="">
            <Login name="new_user" mode="run-review">
                <Booklet>x_booklet</Booklet>
            </Login>
        </Group>
    </Testtakers>';

  const dangerousTesttakers =
    '<Testtakers>
      <Metadata><Description>d</Description></Metadata>
      <Group id="group1" label="">
        <Login name="monitor_1" mode="monitor-group">
          <Booklet>x_booklet</Booklet><!-- ignored -->
        </Login>
        <Login name="monitor_2" mode="monitor-group">
          <Booklet>x_booklet</Booklet><!-- ignored -->
        </Login>
      </Group>
    </Testtakers>';

  public static function setUpBeforeClass(): void {
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
  }

  function setUp(): void {
    require_once "test/unit/mock-classes/ExternalFileMock.php";
    require_once "test/unit/mock-classes/ZIPMock.php";
    require_once "test/unit/mock-classes/PasswordMock.php";

    $this->vfs = VfsForTest::setUp();

    $this->workspaceDaoMock = Mockery::mock('overload:' . WorkspaceDAO::class);
    $this->workspaceDaoMock
      ->allows('getGlobalIds')
      ->andReturn(VfsForTest::globalIds);
  }

  function tearDown(): void {
    Mockery::close();
    unset($this->vfs);
  }

  function test___construct() {
    $workspaceDirectories = scandir(vfsStream::url('root/data'));
    $expectation = array('.', '..', 'ws_1');
    $this->assertEquals($expectation, $workspaceDirectories);

    $workspace1Directories = scandir(vfsStream::url('root/data/ws_1'));
    $expectation = array('.', '..', 'Booklet', 'Resource', 'SysCheck', 'Testtakers', 'Unit');
    $this->assertEquals($expectation, $workspace1Directories);
  }

  function test_getWorkspacePath() {
    $workspace = new Workspace(1);
    $result = $workspace->getWorkspacePath();
    $expectation = 'vfs://root/data/ws_1';
    $this->assertEquals($expectation, $result);
  }

  function test_deleteFiles() {
    /** @var $voDataDir \org\bovigo\vfs\vfsStreamContent */
    $voDataDir = $this->vfs->getChild('data')->getChild('ws_1')->getChild('SysCheck');
    $voDataDir->chmod(0444);
    file_put_contents(DATA_DIR . '/ws_1/Resource/somePlayer.HTML', 'player content');

    $this->workspaceDaoMock
      ->expects('getFiles')
      ->andReturn([
        'Resource' => [
          'verona-player-simple-6.0.html' => new ResourceFile(DATA_DIR . '/ws_1/Resource/verona-player-simple-6.0.html')
        ]
      ]);
    $this->workspaceDaoMock
      ->expects('getBlockedFiles')
      ->andReturn(['Resource/verona-player-simple-6.0.html' => 'Unit/SAMPLE_UNIT2.XML']);

    $workspace = new Workspace(1);

    $result = $workspace->deleteFiles([
      'Resource/verona-player-simple-6.0.html',
      'Resource/somePlayer.HTML',
      'SysCheck/SAMPLE_SYSCHECK.XML',
      'i_dont/even.exist',
      "SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON"
    ]);
    $expectation = new FileDeletionReport(
      deleted: [
        'Resource/somePlayer.HTML',
        "SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON"
      ],
      did_not_exist: ['i_dont/even.exist'],
      not_allowed: ['SysCheck/SAMPLE_SYSCHECK.XML'],
      was_used: ['Resource/verona-player-simple-6.0.html']
    );
    $this->assertEquals($expectation, $result);

    $resourcesLeft = scandir('vfs://root/data/ws_1/Resource');
    $resourcesLeftExpected = [
      '.',
      '..',
      'SAMPLE_UNITCONTENTS.HTM',
      'sample_resource_package.itcr.zip',
      'verona-player-simple-6.0.html'
    ];
    $this->assertEquals($resourcesLeftExpected, $resourcesLeft);
  }

  function test_deleteFiles_rejectIfDependencies() {
    $this->workspaceDaoMock
      ->expects('getFiles')
      ->andReturn([
        'Resource' => [
          'verona-player-simple-6.0.html' => new ResourceFile(DATA_DIR . '/ws_1/Resource/verona-player-simple-6.0.html')
        ]
      ]);
    $this->workspaceDaoMock
      ->expects('getBlockedFiles')
      ->andReturn(['Resource/verona-player-simple-6.0.html' => 'Unit/SAMPLE_UNIT2.XML']);

    $workspace = new Workspace(1);

    $result = $workspace->deleteFiles([
      'Resource/verona-player-simple-6.0.html',
    ]);
    $expectation = new FileDeletionReport(
      deleted: [],
      did_not_exist: [],
      not_allowed: [],
      was_used: ['Resource/verona-player-simple-6.0.html']
    );
    $this->assertEquals($expectation, $result, 'reject deleting, if file was used');
  }

  function test_deleteFiles_rejectIfDependenciesTogetherWithOthers() {
    $this->workspaceDaoMock
      ->expects('getFiles')
      ->andReturn([
        'Resource' => [
          'verona-player-simple-6.0.html' => new ResourceFile(
            DATA_DIR . '/ws_1/Resource/verona-player-simple-6.0.html'
          ),
          'SAMPLE_UNITCONTENTS.HTM' => new ResourceFile(DATA_DIR . 'Resource/SAMPLE_UNITCONTENTS.HTM')
        ],
        'SysCheck' => [
          'SAMPLE_SYSCHECK.XML' => new XMLFileSysCheck(DATA_DIR . '/ws_1/SysCheck/SAMPLE_SYSCHECK.XML')
        ],
        'Testtakers' => [
          'SAMPLE_TESTTAKERS.XML' => new XMLFileTesttakers(DATA_DIR . '/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML')
        ]
      ]);
    $this->workspaceDaoMock
      ->expects('getBlockedFiles')
      ->andReturn([
        'Resource/verona-player-simple-6.0.html' => 'Unit/SAMPLE_UNIT2.XML',
        'Resource/SAMPLE_UNITCONTENTS.HTM' => 'Unit/SAMPLE_UNIT.XML'
      ]);
    $this->workspaceDaoMock
      ->expects('deleteLoginSource')
      ->andReturn(75)
      ->once();
    $this->workspaceDaoMock
      ->expects('deleteFile')
      ->twice();

    $workspace = new Workspace(1);

    $result = $workspace->deleteFiles([
      'Resource/SAMPLE_UNITCONTENTS.HTM',
      'Resource/verona-player-simple-6.0.html',
      'Testtakers/SAMPLE_TESTTAKERS.XML',
      'SysCheck/SAMPLE_SYSCHECK.XML'
    ]);
    $expectation = new FileDeletionReport(
      deleted: [
        'Testtakers/SAMPLE_TESTTAKERS.XML',
        'SysCheck/SAMPLE_SYSCHECK.XML'
      ],
      did_not_exist: [],
      not_allowed: [],
      was_used: [
        'Resource/SAMPLE_UNITCONTENTS.HTM',
        'Resource/verona-player-simple-6.0.html',
      ]
    );
    $this->assertEquals($expectation, $result, 'reject deleting, if file was used');
  }

  function test_countFilesOfAllSubFolders() {
    $workspace = new Workspace(1);

    $expectation = [
      "Testtakers" => 2,
      "SysCheck" => 1,
      "Booklet" => 4,
      "Unit" => 2,
      "Resource" => 3
    ];

    $result = $workspace->countFilesOfAllSubFolders();
    $this->assertEquals($expectation, $result);
  }

  function test_importUncategorizedFiles_singleFile_first_success() {
    file_put_contents(DATA_DIR . '/ws_1/valid.xml', self::validFile);
    file_put_contents(DATA_DIR . '/ws_1/P.HTML', "this would be a player");

    $this->workspaceDaoMock
      ->expects('storeFile')
      ->twice();
    $this->workspaceDaoMock
      ->expects('storeRelations')
      ->andReturn([[], []]);
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->twice();
    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn([], [])
      ->twice();

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles(['valid.xml', 'P.HTML']);

    $this->assertArrayNotHasKey('error', $result["valid.xml"], 'valid file has no errors');
    $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Unit/valid.xml'), 'valid file is imported');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid.xml'), 'cleanup after import');
  }

  function test_importUncategorizedFiles_singleFile_second_fail_invalidfile() {
    file_put_contents(DATA_DIR . '/ws_1/invalid.xml', self::invalidFile);

    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(
        [],
        []
      )->twice();

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles(['invalid.xml']);

    $this->assertGreaterThan(
      0,
      count($result["invalid.xml"]['error']),
      'invalid file has error report'
    );
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/Unit/invalid.xml'), 'invalid file is rejected');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/invalid.xml'), 'cleanup after import');
  }

  function test_importUncategorizedFiles_singleFile_third_fail_duplicate() {
    file_put_contents(DATA_DIR . '/ws_1/Unit/valid.xml', self::validFile);
    file_put_contents(DATA_DIR . '/ws_1/Resource/P.HTML', "this would be a player");
    file_put_contents(DATA_DIR . '/ws_1/valid3.xml', self::validFile2);

    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(
        [
          'Unit' => [
            'VALID-0.0.XML' => new XMLFileUnit(DATA_DIR . '/ws_1/Unit/valid.xml'),
          ]
        ],
        [
          'Resource' => [
            'P-0.0.HTML' => new ResourceFile(DATA_DIR . '/ws_1/Resource/P.HTML')
          ]
        ],
      )->twice();

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles(['valid3.xml']);

    $this->assertFalse(
      file_exists(DATA_DIR . '/ws_1/Unit/valid3.xml'),
      'reject on duplicate id if file names are not the same'
    );
    $this->assertStringContainsString(
      '1st valid file',
      file_get_contents(DATA_DIR . '/ws_1/Unit/valid.xml'),
      "don't overwrite on duplicate id if file names are not the same"
    );
    $this->assertGreaterThan(
      0,
      count($result["valid3.xml"]['error']),
      'return warning on duplicate id if file names are not the same'
    );
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid3.xml'), 'cleanup after import');
  }

  function test_importUncategorizedFiles_singleFile_second_success() {
    file_put_contents(DATA_DIR . '/ws_1/Unit/valid.xml', self::validFile);
    file_put_contents(DATA_DIR . '/ws_1/Resource/P.HTML', "this would be a player");
    file_put_contents(DATA_DIR . '/ws_1/valid.xml', self::validFile2);

    $this->workspaceDaoMock
      ->expects('storeFile');
    $this->workspaceDaoMock
      ->expects('storeRelations')
      ->andReturn([[], []]);
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes');
    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(
        [
          'Unit' => [
            'P-0.0.HTML' => new XMLFileUnit(DATA_DIR . '/ws_1/Unit/valid.xml')
          ]
        ],
        [
          'Resource' => [
            'P-0.0.HTML' => new ResourceFile(DATA_DIR . '/ws_1/Resource/P.HTML')
          ]
        ],
      )->twice();

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles(['valid.xml']);

    $this->assertStringContainsString(
      '2nd valid file',
      file_get_contents(DATA_DIR . '/ws_1/Unit/valid.xml'),
      'allow overwriting if filename and id is the same'
    );
    $this->assertGreaterThan(
      0,
      count($result["valid.xml"]['warning']),
      'return warning if filename and id is the same'
    );
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid.xml'), 'cleanup after import');
  }

  function test_importUncategorizedFiles_multipleFilesWithDependencies() {
    file_put_contents(DATA_DIR . '/ws_1/valid_testtakers.xml', self::validTesttakers);
    file_put_contents(DATA_DIR . '/ws_1/valid_booklet.xml', self::validBooklet);
    file_put_contents(DATA_DIR . '/ws_1/P.html', 'this would be a player');
    file_put_contents(DATA_DIR . '/ws_1/valid_unit.xml', self::validUnit);

    $this->workspaceDaoMock
      ->expects('storeFile')
      ->times(4);
    $this->workspaceDaoMock
      ->expects('storeRelations')
      ->andReturn([[], []])
      ->times(3);
    $this->workspaceDaoMock
      ->expects('getFileById')
      ->andReturn(XMLFileUnit::fromString(self::validUnit))
      ->once();
    $this->workspaceDaoMock
      ->expects('updateUnitDefsAttachments')
      ->once();
    $this->workspaceDaoMock
      ->expects('updateLoginSource')
      ->once();
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->times(4);
    $getAllFilesWhereCalled = -1;
    $this->workspaceDaoMock
      ->shouldReceive('getAllFilesWhere')
      ->andReturnUsing(function () use (&$getAllFilesWhereCalled) {
        $getAllFilesWhereCalled++;
        return match ($getAllFilesWhereCalled) {
          0 => [], // Unit
          1 => [], // Resource
          2 => [], // Booklet
          3 => [ // Unit 2nd time
            'Unit' => [
              'Unit.HTML' => new XMLFileUnit(DATA_DIR . '/ws_1/Unit/valid_unit.xml')
            ]
          ],
          4 => [], // Testtakers
          5 => [ // Booklet 2nd time
            'Booklet' => [
              'BOOKLET.HTML' => new XMLFileBooklet(DATA_DIR . '/ws_1/Booklet/valid_booklet.xml')
            ]
          ]
        };
      })
      ->times(6);


    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles(
      ["valid_testtakers.xml", "valid_booklet.xml", "P.html", "valid_unit.xml"]
    );
    $errors = $this->getErrorsFromValidationResult($result);

    $this->assertCount(0, $errors); // todo wie ruft man mock archive dateien auf, um Files daraus zu bauen

    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid_testtakers.xml'), 'clean after importing');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid_booklet.xml'), 'clean after importing');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/P.html'), 'clean after importing');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid_unit.xml'), 'clean after importing');

    $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Unit/valid_unit.xml'), 'import valid unit');
    $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Booklet/valid_booklet.xml'), 'import valid booklet');
    $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Resource/P.html'), 'import resource');
    $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Testtakers/valid_testtakers.xml'), 'import testtakers');
  }

  function test_importUncategorizedFiles_multipleFilesWithMissingDependencies() {
    file_put_contents(DATA_DIR . '/ws_1/valid_testtakers.xml', self::validTesttakers);
    file_put_contents(DATA_DIR . '/ws_1/valid_booklet.xml', self::validBooklet);
    file_put_contents(DATA_DIR . '/ws_1/valid_unit.xml', self::validUnit);

    $this->workspaceDaoMock
      ->expects('storeFile')
      ->never();
    $this->workspaceDaoMock
      ->expects('storeRelations')
      ->never();
    $this->workspaceDaoMock
      ->expects('getFileById')
      ->never();
    $this->workspaceDaoMock
      ->expects('updateUnitDefsAttachments')
      ->never();
    $this->workspaceDaoMock
      ->expects('updateLoginSource')
      ->never();
    $getAllFilesWhereCalled = -1;
    $this->workspaceDaoMock
      ->shouldReceive('getAllFilesWhere')
      ->andReturnUsing(function () use (&$getAllFilesWhereCalled) {
        $getAllFilesWhereCalled++;
        return match ($getAllFilesWhereCalled) {
          0 => [], // Unit
          1 => [], // Resource
          2 => [], // Booklet
          3 => [ // Unit 2nd time
            'Unit' => [
              'Unit.HTML' => new XMLFileUnit(DATA_DIR . '/ws_1/Unit/valid_unit.xml')
            ]
          ],
          4 => [], // Testtakers
          5 => [ // Booklet 2nd time
            'Booklet' => [
              'BOOKLET.HTML' => new XMLFileBooklet(DATA_DIR . '/ws_1/Booklet/valid_booklet.xml')
            ]
          ]
        };
      })
      ->times(6);


    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles(["valid_testtakers.xml", "valid_booklet.xml", "valid_unit.xml"]);
    $errors = $this->getErrorsFromValidationResult($result);

    $this->assertCount(3, $errors);

    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid_testtakers.xml'), 'clean after importing');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid_booklet.xml'), 'clean after importing');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid_unit.xml'), 'clean after importing');

    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/Unit/valid_unit.xml'), 'import valid unit');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/Booklet/valid_booklet.xml'), 'import valid booklet');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/Testtakers/valid_testtakers.xml'), 'import testtakers');
  }

  function test_importUncategorizedFiles_zipWithValidFilesWithDependencies() {
    ZIP::$mockArchive = [
      'valid_testtakers.xml' => self::validTesttakers,
      'valid_booklet.xml' => self::validBooklet,
      'P.html' => 'this would be a player',
      'valid_unit.xml' => self::validUnit
    ];

    $this->workspaceDaoMock
      ->expects('storeFile')
      ->times(4);
    $this->workspaceDaoMock
      ->expects('storeRelations')
      ->andReturn([[], []])
      ->times(3);
    $this->workspaceDaoMock
      ->expects('getFileById')
      ->andReturn(XMLFileUnit::fromString(self::validUnit))
      ->once();
    $this->workspaceDaoMock
      ->expects('updateUnitDefsAttachments')
      ->once();
    $this->workspaceDaoMock
      ->expects('updateLoginSource')
      ->once();
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->times(4);
    $getAllFilesWhereCalled = -1;
    $this->workspaceDaoMock
      ->shouldReceive('getAllFilesWhere')
      ->andReturnUsing(function () use (&$getAllFilesWhereCalled) {
        $getAllFilesWhereCalled++;
        return match ($getAllFilesWhereCalled) {
          0 => [], // Unit
          1 => [], // Resource
          2 => [], // Booklet
          3 => [ // Unit 2nd time
            'Unit' => [
              'Unit.HTML' => new XMLFileUnit(DATA_DIR . '/ws_1/Unit/valid_unit.xml')
            ]
          ],
          4 => [], // Testtakers
          5 => [ // Booklet 2nd time
            'Booklet' => [
              'BOOKLET.HTML' => new XMLFileBooklet(DATA_DIR . '/ws_1/Booklet/valid_booklet.xml')
            ]
          ]
        };
      })
      ->times(6);

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles(["archive.zip"]);
    $errors = $this->getErrorsFromValidationResult($result);

    $this->assertCount(0, $errors);

    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip_Extract'), 'clean after importing');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip'), 'clean after importing');

    $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Unit/valid_unit.xml'), 'import valid unit from ZIP');
    $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Booklet/valid_booklet.xml'), 'import valid booklet from ZIP');
    $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Resource/P.html'), 'import resource from ZIP');
    $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Testtakers/valid_testtakers.xml'), 'import testtakers from ZIP');
  }

  function test_importUncategorizedFiles_zip_rejectInvalidUnitAndDependantFiles() {
    ZIP::$mockArchive = [
      'valid_testtakers.xml' => self::validTesttakers,
      'valid_booklet.xml' => self::validBooklet,
      'P.html' => 'this would be a player',
      'invalid_unit.xml' => 'INVALID'
    ];

    $this->workspaceDaoMock
      ->shouldReceive('storeFile')
      ->once();
    $this->workspaceDaoMock
      ->shouldReceive('storeRelations')
      ->never();
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->once();
    $getAllFilesWhereCalled = -1;
    $this->workspaceDaoMock
      ->shouldReceive('getAllFilesWhere')
      ->andReturnUsing(function () use (&$getAllFilesWhereCalled) {
        $getAllFilesWhereCalled++;
        return match ($getAllFilesWhereCalled) {
          0 => [], // Resource
          1 => [], // Booklet
          2 => [], // Unit 2nd time
          3 => [], // Testtakers
          4 => [], // Booklet 2nd time
        };
      })
      ->times(5);

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles(["archive.zip"]);
    $errors = $this->getErrorsFromValidationResult($result);

    $this->assertCount(3, $errors);

    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip_Extract'), 'clean after importing');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip'), 'clean after importing');
    $this->assertFalse(
      file_exists($workspace->getWorkspacePath() . '/Unit/valid_unit.xml'),
      'don\'t import invalid Unit from ZIP'
    );
    $this->assertFalse(
      file_exists($workspace->getWorkspacePath() . '/Booklet/valid_booklet.xml'),
      'don\'t import Booklet dependant of invalid unit from ZIP'
    );
    $this->assertTrue(
      file_exists($workspace->getWorkspacePath() . '/Resource/P.html'),
      'import resource from ZIP'
    );
    $this->assertFalse(
      file_exists($workspace->getWorkspacePath() . '/Testtakers/valid_testtakers.xml'),
      'don\'t import Testtakers dependant of invalid unit from ZIP'
    );
  }

  function test_importUncategorizedFiles_zip_rejectInvalidBookletAndDependantFiles() {
    $this->workspaceDaoMock
      ->shouldReceive('storeFile')
      ->twice();
    $this->workspaceDaoMock
      ->shouldReceive('storeRelations')
      ->andReturn([[], []])
      ->once();
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->twice();
    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(null, null, null, null)
      ->times(4);

    $workspace = new Workspace(1);

    ZIP::$mockArchive = [
      'valid_testtakers.xml' => self::validTesttakers,
      'invalid_booklet.xml' => 'INVALID',
      'P.html' => 'this would be a player',
      'valid_unit.xml' => self::validUnit
    ];

    $result = $workspace->importUncategorizedFiles(["archive.zip"]);
    $errors = $this->getErrorsFromValidationResult($result);

    $this->assertCount(2, $errors);

    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip_Extract'), 'clean after importing');
    $this->assertTrue(
      file_exists(DATA_DIR . '/ws_1/Unit/valid_unit.xml'),
      'import valid Unit from ZIP'
    );
    $this->assertFalse(
      file_exists(DATA_DIR . '/ws_1/Booklet/valid_booklet.xml'),
      'don\'t import Booklet dependant of invalid unit from ZIP'
    );
    $this->assertTrue(
      file_exists(DATA_DIR . '/ws_1/Resource/P.html'),
      'import resource from ZIP'
    );
    $this->assertFalse(
      file_exists(DATA_DIR . '/ws_1/Testtakers/valid_testtakers.xml'),
      'don\'t import Testtakers dependant of invalid unit from ZIP'
    );
  }

  function test_importUncategorizedFiles_zip_rejectOnDuplicateId() {
    $this->workspaceDaoMock
      ->shouldReceive('storeFile')
      ->never();
    $this->workspaceDaoMock
      ->shouldReceive('storeRelations')
      ->never();
    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(null, null, null, null)
      ->twice();

    $workspace = new Workspace(1);
    ZIP::$mockArchive = [
      'file_with_used_id.xml' => '<Unit ><Metadata><Id>UNIT.SAMPLE</Id><Label>l</Label></Metadata><Definition player="p">d</Definition></Unit>',
    ];

    $result = $workspace->importUncategorizedFiles(["archive.zip"]);
    $errors = $this->getErrorsFromValidationResult($result);

    $this->assertCount(1, $errors);

    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip_Extract'), 'clean after importing');
    $this->assertFalse(
      file_exists(DATA_DIR . '/ws_1/Unit/valid_unit.xml'),
      'reject file from ZIP on duplicate ID'
    );
  }

  function test_importUncategorizedFiles_zip_handleSubFolders() {
    $this->workspaceDaoMock
      ->shouldReceive('storeFile')
      ->times(4);
    $this->workspaceDaoMock
      ->shouldReceive('storeRelations')
      ->andReturn([[], []])
      ->times(3);
    $this->workspaceDaoMock
      ->expects('getFileById')
      ->once()
      ->withArgs(['X_UNIT', 'Unit'])
      ->andReturn(XMLFileUnit::fromString(self::validUnit));
    $this->workspaceDaoMock
      ->expects('updateUnitDefsAttachments')
      ->once()
      ->withArgs(['X_BOOKLET', []]);
    $this->workspaceDaoMock
      ->expects('updateLoginSource')
      ->once();
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->times(4);
    $getAllFilesWhereCalled = -1;
    $this->workspaceDaoMock
      ->shouldReceive('getAllFilesWhere')
      ->andReturnUsing(function() use (&$getAllFilesWhereCalled) {
        $getAllFilesWhereCalled++;
        return match ($getAllFilesWhereCalled) {
          0 => [], // Unit
          1 => [], // Resource
          2 => [], // Booklet
          3 => [ // Unit 2nd time
            'Unit' => [
              'Unit.HTML' => new XMLFileUnit(DATA_DIR . '/ws_1/Unit/valid_unit.xml')
            ]
          ],
          4 => [], // Testtakers
          5 => [ // Booklet 2nd time
            'Booklet' => [
              'BOOKLET.HTML' => new XMLFileBooklet(DATA_DIR . '/ws_1/Booklet/valid_booklet.xml')
            ]
          ]
        };
      })
      ->times(6);

    $workspace = new Workspace(1);

    ZIP::$mockArchive = [
      'valid_testtakers.xml' => self::validTesttakers,
      'valid_booklet.xml' => self::validBooklet,
      'RESOURCE' => [
        'P.html' => 'this would be a player'
      ],
      'whatever' => [
        'somestuff' => [
          'invalid_unit.xml' => 'INVALID',
          'valid_unit.xml' => self::validUnit
        ]
      ]
    ];

    $result = $workspace->importUncategorizedFiles(["archive.zip"]);
    $errors = $this->getErrorsFromValidationResult($result);
    $this->assertCount(1, $errors);

    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip_Extract'), 'clean after importing');
    $this->assertFalse(
      file_exists($workspace->getWorkspacePath() . '/Unit/invalid_unit.xml'),
      'don\'t import invalid Unit from ZIP'
    );
    $this->assertTrue(
      file_exists($workspace->getWorkspacePath() . '/Unit/valid_unit.xml'),
      'import valid Unit from ZIP'
    );
    $this->assertTrue(
      file_exists($workspace->getWorkspacePath() . '/Booklet/valid_booklet.xml'),
      'import Booklet dependant of invalid unit from ZIP'
    );
    $this->assertTrue(
      file_exists($workspace->getWorkspacePath() . '/Resource/P.html'),
      'import resource from ZIP'
    );
    $this->assertTrue(
      file_exists($workspace->getWorkspacePath() . '/Testtakers/valid_testtakers.xml'),
      'import Testtakers dependant of invalid unit from ZIP'
    );
  }

  // regression test for #235
  function test_importUncategorizedFiles_multiMonitor() {
    $this->workspaceDaoMock
      ->expects('storeFile')
      ->once();
    $this->workspaceDaoMock
      ->expects('storeRelations')
      ->andReturn([[], []])
      ->once();
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->once();
    $this->workspaceDaoMock
      ->expects('updateLoginSource')
      ->andReturn([2, 2])
      ->once();
    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(
        [
          'Testtakers' => [
            'TESTTAKERS.XML' => new XMLFileTesttakers(DATA_DIR . '/ws_1/testtakers.xml'),
          ]
        ], // Testtakers
        [] // Booklet,
      )
      ->times(2);

    $workspace = new Workspace(1);
    file_put_contents(DATA_DIR . '/ws_1/testtakers.xml', self::dangerousTesttakers);

    $result = $workspace->importUncategorizedFiles(['testtakers.xml']);
    $this->assertArrayNotHasKey('error', $result["testtakers.xml"], 'valid file has no errors');
    $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Testtakers/testtakers.xml'), 'valid file is imported');
    $this->assertFalse(file_exists(DATA_DIR . '/ws_1/testtakers.xml'), 'cleanup after import');
  }

  private function getErrorsFromValidationResult($result): array {
    return array_filter(
      array_map(function (array $fileReport) {
        return $fileReport['error'] ?? null;
      }, $result),
      'is_array'
    );
  }

  function test_getFileById_validXmlFile(): void {
    $this->workspaceDaoMock
      ->expects('getFileById')
      ->once()
      ->withArgs(['SYSCHECK.SAMPLE', 'SysCheck'])
      ->andReturn(new XMLFileSysCheck('vfs://root/data/ws_1/SysCheck/SAMPLE_SYSCHECK.XML'));
    $workspace = new Workspace(1);

    $result = $workspace->getFileById('SysCheck', 'SYSCHECK.SAMPLE');

    $this->assertEquals('XMLFileSysCheck', get_class($result));
    $this->assertEquals('vfs://root/data/ws_1/SysCheck/SAMPLE_SYSCHECK.XML', $result->getPath());
  }

  function test_getFileById_notExistingXmlFile(): void {
    $this->workspaceDaoMock
      ->expects('getFileById')
      ->once()
      ->withArgs(['not-existing-id', 'SysCheck'])
      ->andReturn(null);
    $workspace = new Workspace(1);

    $this->expectException("HttpError");
    $workspace->getFileById('SysCheck', 'not-existing-id');
  }

  function test_getFileById_notExistingType(): void {
    $this->workspaceDaoMock
      ->expects('getFileById')
      ->once()
      ->withArgs(['SYSCHECK.SAMPLE', 'not-existing-type']);
    $workspace = new Workspace(1);

    $this->expectException("Exception");
    $workspace->getFileById('not-existing-type', 'SYSCHECK.SAMPLE');
  }

  function test_getFileById_test_invalidXmlFile(): void {
    $this->workspaceDaoMock
      ->expects('getFileById')
      ->once()
      ->withArgs(['SYSCHECK.SAMPLE', 'SysCheck'])
      ->andReturn(new XMLFileSysCheck('SYSCHECK.SAMPLE'));
    $workspace = new Workspace(1);

    $this->expectException("HttpError");
    $workspace->getFileById('SysCheck', 'SYSCHECK.SAMPLE');
  }
}
