<?php
declare(strict_types=1);
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
  private string $stagingPath;
  /** @var list<array{subject_type: string, subject_name: string, object_type: string, object_id: string}> */
  private array $storedRelations;

  const validFile = '<Unit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
    . ' xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/unit-xml/17.4">'
    . '<Metadata><Id>id</Id><Label>l</Label></Metadata>'
    . '<Definition player="p">1st valid file</Definition>'
    . '</Unit>';
  const invalidFile = '<Unit><Metadata><Id>id</Id></Metadata></Unit>';
  const validFile2 = '<Unit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
    . ' xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/unit-xml/17.4">'
    . '<Metadata><Id>id</Id><Label>l</Label></Metadata>'
    . '<Definition player="p">2nd valid file</Definition>'
    . '</Unit>';
  const validUnit = '<Unit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
    . ' xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/unit-xml/17.4">'
    . '<Metadata><Id>x_unit</Id><Label>l</Label></Metadata>'
    . '<Definition player="p">valid extracted unit</Definition>'
    . '</Unit>';
  const validBooklet = '<Booklet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
    . ' xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-booklet-xml/18.0">'
    . '<Metadata><Id>x_booklet</Id><Label>l</Label></Metadata>'
    . '<Units><Unit label="l" id="x_unit" /></Units>'
    . '</Booklet>';
  const validTesttakers =
    '<Testtakers xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-testtaker-xml/18.0">
      <Metadata><Description>d</Description></Metadata>
      <Group id="new_group" label="">
          <Login name="new_user" mode="run-review">
              <Booklet>x_booklet</Booklet>
          </Login>
      </Group>
    </Testtakers>';

  const dangerousTesttakers =
    '<Testtakers xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-testtaker-xml/18.0">
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
    require_once "test/unit/mock-classes/PasswordMock.php";

    $this->vfs = VfsForTest::setUp();
    $this->stagingPath = vfsStream::url('root/staging');
    mkdir($this->stagingPath);

    $this->workspaceDaoMock = Mockery::mock('overload:' . WorkspaceDAO::class);
    $this->workspaceDaoMock
      ->allows('getGlobalIds')
      ->andReturn(VfsForTest::globalIds);
    $this->workspaceDaoMock
      ->allows('deleteAssetAssignmentSource')
      ->andReturn(0);
    $this->workspaceDaoMock
      ->allows('updateAssetAssignmentSource')
      ->andReturn(['deleted' => 0, 'added' => 0]);
    $this->storedRelations = [];
    $this->workspaceDaoMock
      ->allows('getRelations')
      ->andReturnUsing(fn(): array => $this->storedRelations);
  }

  function tearDown(): void {
    Mockery::close();
    unset($this->vfs);
  }

  function test___construct_writesNothingToStorage() {
    new Workspace(3);

    static::assertEquals(['.', '..', 'ws_1'], scandir(vfsStream::url('root/data')));
  }

  function test_deleteFiles() {
    /** @var $voDataDir \org\bovigo\vfs\vfsStreamContent */
    $voDataDir = $this->vfs->getChild('data')->getChild('ws_1')->getChild('SysCheck');
    $voDataDir->chmod(0o444);
    file_put_contents(VfsForTest::dataDir . '/ws_1/Resource/somePlayer.HTML', 'player content');
    // in a separate process PHPUnit treats anything on stderr as an error
    $errorLog = tempnam(sys_get_temp_dir(), 'error-log');
    ini_set('error_log', $errorLog);

    $this->workspaceDaoMock
      ->expects('getFiles')
      ->andReturn([
        'Resource' => [
          'verona-player-simple-6.0.html' => VfsForTest::loadAndValidateFile('ws_1/Resource/verona-player-simple-6.0.html', 'Resource')
        ]
      ]);
    $this->workspaceDaoMock
      ->expects('getBlockedFiles')
      ->andReturn(['Resource/verona-player-simple-6.0.html' => 'Unit/SAMPLE_UNIT2.XML']);
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);

    $result = $workspace->deleteFiles([
      'Resource/verona-player-simple-6.0.html',
      'Resource/somePlayer.HTML',
      'SysCheck/SAMPLE_SYSCHECK.XML',
      'i_dont/even.exist',
      "SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON",
      'Resource/../Unit/SAMPLE_UNIT.XML',
      'no-type'
    ]);
    $expectation = new FileDeletionReport(
      deleted: [
        'Resource/somePlayer.HTML',
        "SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON"
      ],
      did_not_exist: ['i_dont/even.exist'],
      not_allowed: ['SysCheck/SAMPLE_SYSCHECK.XML'],
      was_used: ['Resource/verona-player-simple-6.0.html'],
      incorrect_path: ['Resource/../Unit/SAMPLE_UNIT.XML', 'no-type']
    );
    static::assertEquals($expectation, $result);

    $resourcesLeft = scandir('vfs://root/data/ws_1/Resource');
    $resourcesLeftExpected = [
      '.',
      '..',
      'SAMPLE_UNITCONTENTS.HTM',
      'coding-scheme.vocs.json',
      'sample_resource_package.itcr.zip',
      'verona-player-simple-6.0.html'
    ];
    static::assertEquals($resourcesLeftExpected, $resourcesLeft);
    static::assertFileExists(VfsForTest::dataDir . '/ws_1/Unit/SAMPLE_UNIT.XML');
    static::assertStringContainsString('Could not delete `ws_1/SysCheck/SAMPLE_SYSCHECK.XML`', file_get_contents($errorLog));
    unlink($errorLog);
  }

  function test_delete(): void {
    file_put_contents(VfsForTest::dataDir . '/ws_1.txt', 'shares the prefix, but is not part of ws_1');

    (new Workspace(1))->delete();

    static::assertEquals(['.', '..', 'ws_1.txt'], scandir(vfsStream::url('root/data')));
  }

  function test_deleteFiles_rejectIfDependencies() {
    $this->workspaceDaoMock
      ->expects('getFiles')
      ->andReturn([
        'Resource' => [
          'verona-player-simple-6.0.html' => VfsForTest::loadAndValidateFile('ws_1/Resource/verona-player-simple-6.0.html', 'Resource')
        ]
      ]);
    $this->workspaceDaoMock
      ->expects('getBlockedFiles')
      ->andReturn(['Resource/verona-player-simple-6.0.html' => 'Unit/SAMPLE_UNIT2.XML']);
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

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
    static::assertEquals($expectation, $result, 'reject deleting, if file was used');
  }

  function test_deleteFiles_rejectIfDependenciesTogetherWithOthers() {
    $this->workspaceDaoMock
      ->expects('getFiles')
      ->andReturn([
        'Resource' => [
          'verona-player-simple-6.0.html' => VfsForTest::loadAndValidateFile('ws_1/Resource/verona-player-simple-6.0.html', 'Resource'),
          'SAMPLE_UNITCONTENTS.HTM' => VfsForTest::loadAndValidateFile('ws_1/Resource/SAMPLE_UNITCONTENTS.HTM', 'Resource')
        ],
        'SysCheck' => [
          'SAMPLE_SYSCHECK.XML' => VfsForTest::loadAndValidateFile('ws_1/SysCheck/SAMPLE_SYSCHECK.XML', 'SysCheck')
        ],
        'Testtakers' => [
          'SAMPLE_TESTTAKERS.XML' => VfsForTest::loadAndValidateFile('ws_1/Testtakers/SAMPLE_TESTTAKERS.XML', 'Testtakers')
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
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

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
    static::assertEquals($expectation, $result, 'reject deleting, if file was used');
  }

  function test_loadAndValidateFile_takesSizeAndTimeFromTheGivenInfo() {
    $path = StoragePath::fromString('ws_1/Booklet/SAMPLE_BOOKLET.XML');

    $file = Workspace::loadAndValidateFile($path, 'Booklet', new FileInfo(7, 42));

    static::assertEquals(7, $file->getSize());
    static::assertEquals(42, $file->getModificationTime());
    static::assertTrue($file->isValid());
  }


  function test_countFilesOfAllSubFolders() {
    $workspace = new Workspace(1);

    $expectation = [
      "Testtakers" => 2,
      "SysCheck" => 1,
      "Booklet" => 4,
      "Unit" => 2,
      "Resource" => 4
    ];

    $result = $workspace->countFilesOfAllSubFolders();
    static::assertEquals($expectation, $result);
  }

  function test_importUncategorizedFiles_singleFile_first_success() {
    file_put_contents($this->stagingPath . '/valid.xml', self::validFile);
    file_put_contents($this->stagingPath . '/P.HTML', "this would be a player");

    $this->workspaceDaoMock
      ->expects('storeFile')
      ->twice();
    $this->workspaceDaoMock
      ->expects('storeRelations');
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->twice()
      ->andReturn([]);
    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn([], [])
      ->twice();
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ['valid.xml', 'P.HTML']);

    static::assertArrayNotHasKey('error', $result["valid.xml"], 'valid file has no errors');
    static::assertTrue(file_exists(VfsForTest::dataDir . '/ws_1/Unit/valid.xml'), 'valid file is imported');
  }

  function test_importUncategorizedFiles_singleFile_second_fail_invalidfile() {
    file_put_contents($this->stagingPath . '/invalid.xml', self::invalidFile);

    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(
        [],
        []
      )->twice();
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ['invalid.xml']);

    static::assertGreaterThan(
      0,
      count($result["invalid.xml"]['error']),
      'invalid file has error report'
    );
    static::assertFalse(file_exists(VfsForTest::dataDir . '/ws_1/Unit/invalid.xml'), 'invalid file is rejected');
  }

  function test_importUncategorizedFiles_singleFile_third_fail_duplicate() {
    file_put_contents(VfsForTest::dataDir . '/ws_1/Unit/valid.xml', self::validFile);
    file_put_contents(VfsForTest::dataDir . '/ws_1/Resource/P.HTML', "this would be a player");
    file_put_contents($this->stagingPath . '/valid3.xml', self::validFile2);

    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(
        [
          'Unit' => [
            'VALID-0.0.XML' => VfsForTest::loadAndValidateFile('ws_1/Unit/valid.xml', 'Unit'),
          ]
        ],
        [
          'Resource' => [
            'P-0.0.HTML' => VfsForTest::loadAndValidateFile('ws_1/Resource/P.HTML', 'Resource')
          ]
        ],
      )->twice();
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ['valid3.xml']);

    static::assertFalse(
      file_exists(VfsForTest::dataDir . '/ws_1/Unit/valid3.xml'),
      'reject on duplicate id if file names are not the same'
    );
    static::assertStringContainsString(
      '1st valid file',
      file_get_contents(VfsForTest::dataDir . '/ws_1/Unit/valid.xml'),
      "don't overwrite on duplicate id if file names are not the same"
    );
    static::assertGreaterThan(
      0,
      count($result["valid3.xml"]['error']),
      'return warning on duplicate id if file names are not the same'
    );
  }

  function test_importUncategorizedFiles_singleFile_second_success() {
    file_put_contents(VfsForTest::dataDir . '/ws_1/Unit/valid.xml', self::validFile);
    file_put_contents(VfsForTest::dataDir . '/ws_1/Resource/P.HTML', "this would be a player");
    file_put_contents($this->stagingPath . '/valid.xml', self::validFile2);

    $this->workspaceDaoMock
      ->expects('storeFile');
    $this->workspaceDaoMock
      ->expects('storeRelations');
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->andReturn([]);
    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(
        [
          'Unit' => [
            'P-0.0.HTML' => VfsForTest::loadAndValidateFile('ws_1/Unit/valid.xml', 'Unit')
          ]
        ],
        [
          'Resource' => [
            'P-0.0.HTML' => VfsForTest::loadAndValidateFile('ws_1/Resource/P.HTML', 'Resource')
          ]
        ],
      )->twice();
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ['valid.xml']);

    static::assertStringContainsString(
      '2nd valid file',
      file_get_contents(VfsForTest::dataDir . '/ws_1/Unit/valid.xml'),
      'allow overwriting if filename and id is the same'
    );
    static::assertGreaterThan(
      0,
      count($result["valid.xml"]['warning']),
      'return warning if filename and id is the same'
    );
  }

  function test_importUncategorizedFiles_singleFile_fail_sameNameDifferentId() {
    file_put_contents(VfsForTest::dataDir . '/ws_1/Unit/valid.xml', self::validFile);
    file_put_contents(VfsForTest::dataDir . '/ws_1/Resource/P.HTML', "this would be a player");
    file_put_contents($this->stagingPath . '/valid.xml', self::validUnit);

    $this->workspaceDaoMock
      ->shouldReceive('storeFile')
      ->never();
    $this->workspaceDaoMock
      ->shouldReceive('storeRelations')
      ->never();
    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(
        [
          'Unit' => [
            'VALID.XML' => VfsForTest::loadAndValidateFile('ws_1/Unit/valid.xml', 'Unit')
          ]
        ],
        [
          'Resource' => [
            'P-0.0.HTML' => VfsForTest::loadAndValidateFile('ws_1/Resource/P.HTML', 'Resource')
          ]
        ],
      )->twice();
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ['valid.xml']);

    static::assertStringContainsString(
      '1st valid file',
      file_get_contents(VfsForTest::dataDir . '/ws_1/Unit/valid.xml'),
      "don't overwrite if filename is the same but id differs"
    );
    static::assertGreaterThan(
      0,
      count($result["valid.xml"]['error']),
      'return error if filename is the same but id differs'
    );
  }

  function test_importUncategorizedFiles_multipleFilesWithDependencies() {
    file_put_contents($this->stagingPath . '/valid_testtakers.xml', self::validTesttakers);
    file_put_contents($this->stagingPath . '/valid_booklet.xml', self::validBooklet);
    file_put_contents($this->stagingPath . '/P.html', 'this would be a player');
    file_put_contents($this->stagingPath . '/valid_unit.xml', self::validUnit);

    $this->workspaceDaoMock
      ->expects('storeFile')
      ->times(4);
    $this->workspaceDaoMock
      ->expects('storeRelations')
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
      ->times(4)
      ->andReturn([]);
    $getAllFilesWhereCalled = -1;
    $this->workspaceDaoMock
      ->shouldReceive('getAllFilesWhere')
      ->andReturnUsing(static function () use (&$getAllFilesWhereCalled) {
        $getAllFilesWhereCalled++;
        return match ($getAllFilesWhereCalled) {
          0 => [], // Unit
          1 => [], // Resource
          2 => [], // Booklet
          3 => [ // Unit 2nd time
            'Unit' => [
              'Unit.HTML' => VfsForTest::loadAndValidateFile('ws_1/Unit/valid_unit.xml', 'Unit')
            ]
          ],
          4 => [], // Testtakers
          5 => [ // Booklet 2nd time
            'Booklet' => [
              'BOOKLET.HTML' => VfsForTest::loadAndValidateFile('ws_1/Booklet/valid_booklet.xml', 'Booklet')
            ]
          ]
        };
      })
      ->times(6);
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');


    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles(
      $this->stagingPath,
      ["valid_testtakers.xml", "valid_booklet.xml", "P.html", "valid_unit.xml"]
    );
    $errors = $this->getErrorsFromValidationResult($result);

    static::assertCount(0, $errors); // todo wie ruft man mock archive dateien auf, um Files daraus zu bauen


    static::assertTrue(file_exists(VfsForTest::dataDir . '/ws_1/Unit/valid_unit.xml'), 'import valid unit');
    static::assertTrue(file_exists(VfsForTest::dataDir . '/ws_1/Booklet/valid_booklet.xml'), 'import valid booklet');
    static::assertTrue(file_exists(VfsForTest::dataDir . '/ws_1/Resource/P.html'), 'import resource');
    static::assertTrue(file_exists(VfsForTest::dataDir . '/ws_1/Testtakers/valid_testtakers.xml'), 'import testtakers');
  }

  function test_importUncategorizedFiles_doesNotValidateStoredFilesAgain() {
    file_put_contents(VfsForTest::dataDir . '/ws_1/Unit/stored.xml', self::validUnit);
    $storedUnit = new XMLFileUnit(new FileData(StoragePath::fromString('ws_1/Unit/stored.xml'), 'Unit', 'X_UNIT'));
    file_put_contents($this->stagingPath . '/valid.xml', self::validFile);
    file_put_contents($this->stagingPath . '/P.HTML', 'this would be a player');

    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(['Unit' => ['X_UNIT' => $storedUnit]], [])
      ->twice();
    $this->workspaceDaoMock->allows('storeFile');
    $this->workspaceDaoMock->allows('storeRelations');
    $this->workspaceDaoMock->allows('getDependentFilesByTypes')->andReturn([]);
    $this->workspaceDaoMock->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ['valid.xml', 'P.HTML']);

    static::assertArrayNotHasKey('error', $result['valid.xml']);
    static::assertEquals([], $storedUnit->getRelations(), 'the stored unit is not cross-validated');
  }

  function test_importUncategorizedFiles_resourceUsedByStoredFileIsNotUnused() {
    file_put_contents($this->stagingPath . '/valid.xml', self::validFile);
    file_put_contents($this->stagingPath . '/P.HTML', 'this would be a player');
    file_put_contents($this->stagingPath . '/R.VOUD', 'a definition only a stored unit uses');
    $this->storedRelations = [
      ['subject_type' => 'Unit', 'subject_name' => 'stored.xml', 'object_type' => 'Resource', 'object_id' => 'R.VOUD']
    ];

    $this->workspaceDaoMock->expects('getAllFilesWhere')->andReturn([], [])->twice();
    $this->workspaceDaoMock->allows('storeFile');
    $this->workspaceDaoMock->allows('storeRelations');
    $this->workspaceDaoMock->allows('getDependentFilesByTypes')->andReturn([]);
    $this->workspaceDaoMock->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ['valid.xml', 'P.HTML', 'R.VOUD']);

    static::assertNotContains('Resource is never used', $result['R.VOUD']['warning'] ?? []);
  }

  function test_importUncategorizedFiles_relationsOfReplacedFilesDoNotCount() {
    file_put_contents($this->stagingPath . '/valid.xml', self::validFile);
    file_put_contents($this->stagingPath . '/P.HTML', 'this would be a player');
    file_put_contents($this->stagingPath . '/R.VOUD', 'a definition the replaced unit used');
    $this->storedRelations = [
      ['subject_type' => 'Unit', 'subject_name' => 'valid.xml', 'object_type' => 'Resource', 'object_id' => 'R.VOUD']
    ];

    $this->workspaceDaoMock->expects('getAllFilesWhere')->andReturn([], [])->twice();
    $this->workspaceDaoMock->allows('storeFile');
    $this->workspaceDaoMock->allows('storeRelations');
    $this->workspaceDaoMock->allows('getDependentFilesByTypes')->andReturn([]);
    $this->workspaceDaoMock->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ['valid.xml', 'P.HTML', 'R.VOUD']);

    static::assertContains('Resource is never used', $result['R.VOUD']['warning'] ?? []);
  }

  function test_importUncategorizedFiles_rejectDuplicateResourceIdUploadedWithUnit() {
    $player = '<html lang="de"><head><script type="application/ld+json">'
      . '{"type": "PLAYER", "id": "dup-player", "name": [{"lang": "de", "value": "Player"}], "version": "1.0.0", '
      . '"specVersion": "6.0", "metadataVersion": "3.1"}'
      . '</script></head><body>!</body></html>';
    file_put_contents(VfsForTest::dataDir . '/ws_1/Resource/dup-player-1.0.html', $player);
    file_put_contents($this->stagingPath . '/dup-player-copy.html', $player);
    file_put_contents($this->stagingPath . '/valid_unit.xml', self::validUnit);

    $getAllFilesWhereCalled = -1;
    $this->workspaceDaoMock
      ->shouldReceive('getAllFilesWhere')
      ->andReturnUsing(static function () use (&$getAllFilesWhereCalled) {
        $getAllFilesWhereCalled++;
        return match ($getAllFilesWhereCalled) {
          0 => [], // Unit
          1 => ['Resource' => ['DUP-PLAYER-1.0' => VfsForTest::loadAndValidateFile('ws_1/Resource/dup-player-1.0.html', 'Resource')]]
        };
      });
    $this->workspaceDaoMock->allows('storeFile');
    $this->workspaceDaoMock->allows('storeRelations');
    $this->workspaceDaoMock->allows('getDependentFilesByTypes')->andReturn([]);
    $this->workspaceDaoMock->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ['dup-player-copy.html', 'valid_unit.xml']);

    static::assertContains(
      'Duplicate Resource-Id: `DUP-PLAYER-1.0` (dup-player-1.0.html)',
      $result['dup-player-copy.html']['error'] ?? []
    );
    static::assertFalse(file_exists(VfsForTest::dataDir . '/ws_1/Resource/dup-player-copy.html'));
  }

  function test_importUncategorizedFiles_multipleFilesWithMissingDependencies() {
    file_put_contents($this->stagingPath . '/valid_testtakers.xml', self::validTesttakers);
    file_put_contents($this->stagingPath . '/valid_booklet.xml', self::validBooklet);
    file_put_contents($this->stagingPath . '/valid_unit.xml', self::validUnit);

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
      ->andReturnUsing(static function () use (&$getAllFilesWhereCalled) {
        $getAllFilesWhereCalled++;
        return match ($getAllFilesWhereCalled) {
          0 => [], // Unit
          1 => [], // Resource
          2 => [], // Booklet
          3 => [ // Unit 2nd time
            'Unit' => [
              'Unit.HTML' => new FileData(StoragePath::fromString('ws_1/Unit/valid_unit.xml'), 'Unit', 'VALID_UNIT.XML', isValid: false)
            ]
          ],
          4 => [], // Testtakers
          5 => [ // Booklet 2nd time
            'Booklet' => [
              'BOOKLET.HTML' => new FileData(StoragePath::fromString('ws_1/Booklet/valid_booklet.xml'), 'Booklet', 'VALID_BOOKLET.XML', isValid: false)
            ]
          ]
        };
      })
      ->times(6);
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');


    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ["valid_testtakers.xml", "valid_booklet.xml", "valid_unit.xml"]);
    $errors = $this->getErrorsFromValidationResult($result);

    static::assertCount(3, $errors);


    static::assertFalse(file_exists(VfsForTest::dataDir . '/ws_1/Unit/valid_unit.xml'), 'import valid unit');
    static::assertFalse(file_exists(VfsForTest::dataDir . '/ws_1/Booklet/valid_booklet.xml'), 'import valid booklet');
    static::assertFalse(file_exists(VfsForTest::dataDir . '/ws_1/Testtakers/valid_testtakers.xml'), 'import testtakers');
  }

  function test_importUncategorizedFiles_zipWithValidFilesWithDependencies() {
    file_put_contents($this->stagingPath . '/archive.zip', ZipForTest::createContent([
      'valid_testtakers.xml' => self::validTesttakers,
      'valid_booklet.xml' => self::validBooklet,
      'P.html' => 'this would be a player',
      'valid_unit.xml' => self::validUnit
    ]));

    $this->workspaceDaoMock
      ->expects('storeFile')
      ->times(4);
    $this->workspaceDaoMock
      ->expects('storeRelations')
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
      ->times(4)
      ->andReturn([]);
    $getAllFilesWhereCalled = -1;
    $this->workspaceDaoMock
      ->shouldReceive('getAllFilesWhere')
      ->andReturnUsing(static function () use (&$getAllFilesWhereCalled) {
        $getAllFilesWhereCalled++;
        return match ($getAllFilesWhereCalled) {
          0 => [], // Unit
          1 => [], // Resource
          2 => [], // Booklet
          3 => [ // Unit 2nd time
            'Unit' => [
              'Unit.HTML' => VfsForTest::loadAndValidateFile('ws_1/Unit/valid_unit.xml', 'Unit')
            ]
          ],
          4 => [], // Testtakers
          5 => [ // Booklet 2nd time
            'Booklet' => [
              'BOOKLET.HTML' => VfsForTest::loadAndValidateFile('ws_1/Booklet/valid_booklet.xml', 'Booklet')
            ]
          ]
        };
      })
      ->times(6);
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ["archive.zip"]);
    $errors = $this->getErrorsFromValidationResult($result);

    static::assertCount(0, $errors);


    static::assertTrue(file_exists(VfsForTest::dataDir . '/ws_1/Unit/valid_unit.xml'), 'import valid unit from ZIP');
    static::assertTrue(file_exists(VfsForTest::dataDir . '/ws_1/Booklet/valid_booklet.xml'), 'import valid booklet from ZIP');
    static::assertTrue(file_exists(VfsForTest::dataDir . '/ws_1/Resource/P.html'), 'import resource from ZIP');
    static::assertTrue(file_exists(VfsForTest::dataDir . '/ws_1/Testtakers/valid_testtakers.xml'), 'import testtakers from ZIP');
  }

  function test_importUncategorizedFiles_zip_rejectInvalidUnitAndDependantFiles() {
    file_put_contents($this->stagingPath . '/archive.zip', ZipForTest::createContent([
      'valid_testtakers.xml' => self::validTesttakers,
      'valid_booklet.xml' => self::validBooklet,
      'P.html' => 'this would be a player',
      'invalid_unit.xml' => 'INVALID'
    ]));

    $this->workspaceDaoMock
      ->shouldReceive('storeFile')
      ->once();
    $this->workspaceDaoMock
      ->shouldReceive('storeRelations')
      ->never();
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->once()
      ->andReturn([]);
    $getAllFilesWhereCalled = -1;
    $this->workspaceDaoMock
      ->shouldReceive('getAllFilesWhere')
      ->andReturnUsing(static function () use (&$getAllFilesWhereCalled) {
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
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    $result = $workspace->importUncategorizedFiles($this->stagingPath, ["archive.zip"]);
    $errors = $this->getErrorsFromValidationResult($result);

    static::assertCount(3, $errors);

    static::assertFalse(
      file_exists(VfsForTest::dataDir . '/ws_1/Unit/valid_unit.xml'),
      'don\'t import invalid Unit from ZIP'
    );
    static::assertFalse(
      file_exists(VfsForTest::dataDir . '/ws_1/Booklet/valid_booklet.xml'),
      'don\'t import Booklet dependant of invalid unit from ZIP'
    );
    static::assertTrue(
      file_exists(VfsForTest::dataDir . '/ws_1/Resource/P.html'),
      'import resource from ZIP'
    );
    static::assertFalse(
      file_exists(VfsForTest::dataDir . '/ws_1/Testtakers/valid_testtakers.xml'),
      'don\'t import Testtakers dependant of invalid unit from ZIP'
    );
  }

  function test_importUncategorizedFiles_zip_rejectInvalidBookletAndDependantFiles() {
    $this->workspaceDaoMock
      ->shouldReceive('storeFile')
      ->twice();
    $this->workspaceDaoMock
      ->shouldReceive('storeRelations')
      ->once();
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->twice()
      ->andReturn([]);
    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn([], [], [], [])
      ->times(4);
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);

    file_put_contents($this->stagingPath . '/archive.zip', ZipForTest::createContent([
      'valid_testtakers.xml' => self::validTesttakers,
      'invalid_booklet.xml' => 'INVALID',
      'P.html' => 'this would be a player',
      'valid_unit.xml' => self::validUnit
    ]));

    $result = $workspace->importUncategorizedFiles($this->stagingPath, ["archive.zip"]);
    $errors = $this->getErrorsFromValidationResult($result);

    static::assertCount(2, $errors);

    static::assertTrue(
      file_exists(VfsForTest::dataDir . '/ws_1/Unit/valid_unit.xml'),
      'import valid Unit from ZIP'
    );
    static::assertFalse(
      file_exists(VfsForTest::dataDir . '/ws_1/Booklet/valid_booklet.xml'),
      'don\'t import Booklet dependant of invalid unit from ZIP'
    );
    static::assertTrue(
      file_exists(VfsForTest::dataDir . '/ws_1/Resource/P.html'),
      'import resource from ZIP'
    );
    static::assertFalse(
      file_exists(VfsForTest::dataDir . '/ws_1/Testtakers/valid_testtakers.xml'),
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
      ->andReturn([], [])
      ->twice();
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    file_put_contents($this->stagingPath . '/archive.zip', ZipForTest::createContent([
      'file_with_used_id.xml' => '<Unit ><Metadata><Id>UNIT.SAMPLE</Id><Label>l</Label></Metadata><Definition player="p">d</Definition></Unit>',
    ]));

    $result = $workspace->importUncategorizedFiles($this->stagingPath, ["archive.zip"]);
    $errors = $this->getErrorsFromValidationResult($result);

    static::assertCount(1, $errors);

    static::assertFalse(
      file_exists(VfsForTest::dataDir . '/ws_1/Unit/valid_unit.xml'),
      'reject file from ZIP on duplicate ID'
    );
  }

  function test_importUncategorizedFiles_zip_handleSubFolders() {
    $this->workspaceDaoMock
      ->shouldReceive('storeFile')
      ->times(4);
    $this->workspaceDaoMock
      ->shouldReceive('storeRelations')
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
      ->times(4)
      ->andReturn([]);
    $getAllFilesWhereCalled = -1;
    $this->workspaceDaoMock
      ->shouldReceive('getAllFilesWhere')
      ->andReturnUsing(static function() use (&$getAllFilesWhereCalled) {
        $getAllFilesWhereCalled++;
        return match ($getAllFilesWhereCalled) {
          0 => [], // Unit
          1 => [], // Resource
          2 => [], // Booklet
          3 => [ // Unit 2nd time
            'Unit' => [
              'Unit.HTML' => VfsForTest::loadAndValidateFile('ws_1/Unit/valid_unit.xml', 'Unit')
            ]
          ],
          4 => [], // Testtakers
          5 => [ // Booklet 2nd time
            'Booklet' => [
              'BOOKLET.HTML' => VfsForTest::loadAndValidateFile('ws_1/Booklet/valid_booklet.xml', 'Booklet')
            ]
          ]
        };
      })
      ->times(6);
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);

    file_put_contents($this->stagingPath . '/archive.zip', ZipForTest::createContent([
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
    ]));

    $result = $workspace->importUncategorizedFiles($this->stagingPath, ["archive.zip"]);
    $errors = $this->getErrorsFromValidationResult($result);
    static::assertCount(1, $errors);

    static::assertFalse(
      file_exists(VfsForTest::dataDir . '/ws_1/Unit/invalid_unit.xml'),
      'don\'t import invalid Unit from ZIP'
    );
    static::assertTrue(
      file_exists(VfsForTest::dataDir . '/ws_1/Unit/valid_unit.xml'),
      'import valid Unit from ZIP'
    );
    static::assertTrue(
      file_exists(VfsForTest::dataDir . '/ws_1/Booklet/valid_booklet.xml'),
      'import Booklet dependant of invalid unit from ZIP'
    );
    static::assertTrue(
      file_exists(VfsForTest::dataDir . '/ws_1/Resource/P.html'),
      'import resource from ZIP'
    );
    static::assertTrue(
      file_exists(VfsForTest::dataDir . '/ws_1/Testtakers/valid_testtakers.xml'),
      'import Testtakers dependant of invalid unit from ZIP'
    );
  }

  // regression test for #235
  function test_importUncategorizedFiles_multiMonitor() {
    file_put_contents(VfsForTest::dataDir . '/ws_1/Testtakers/testtakers.xml', self::dangerousTesttakers);

    $this->workspaceDaoMock
      ->expects('storeFile')
      ->once();
    $this->workspaceDaoMock
      ->expects('storeRelations')
      ->once();
    $this->workspaceDaoMock
      ->expects('getDependentFilesByTypes')
      ->once()
      ->andReturn([]);
    $this->workspaceDaoMock
      ->expects('updateLoginSource')
      ->andReturn([2, 2])
      ->once();
    $this->workspaceDaoMock
      ->expects('getAllFilesWhere')
      ->andReturn(
        [
          'Testtakers' => [
            'TESTTAKERS.XML' => VfsForTest::loadAndValidateFile('ws_1/Testtakers/testtakers.xml', 'Testtakers'),
          ]
        ], // Testtakers
        [] // Booklet,
      )
      ->times(2);
    $this->workspaceDaoMock
      ->expects('updateContentTypeBasedOnRemainingTesttakers');

    $workspace = new Workspace(1);
    file_put_contents($this->stagingPath . '/testtakers.xml', self::dangerousTesttakers);

    $result = $workspace->importUncategorizedFiles($this->stagingPath, ['testtakers.xml']);
    static::assertArrayNotHasKey('error', $result["testtakers.xml"], 'valid file has no errors');
    static::assertCount(1, $result["testtakers.xml"]['warning'], 'stored file is overwritten');
  }

  private function getErrorsFromValidationResult($result): array {
    return array_filter(
      array_map(static function (array $fileReport) {
        return $fileReport['error'] ?? null;
      }, $result),
      'is_array'
    );
  }

  function test_getWorkspaceHash_ignoresFilesTheRescanDoesNotRead(): void {
    $workspace = new Workspace(1);
    $hash = $workspace->getWorkspaceHash();

    file_put_contents(VfsForTest::dataDir . '/ws_1/.lock', '.');
    file_put_contents(VfsForTest::dataDir . '/ws_1/SysCheck/reports/report_new.json', '{}');
    Folder::createPath(VfsForTest::dataDir . '/ws_1/Resource/package');
    file_put_contents(VfsForTest::dataDir . '/ws_1/Resource/package/index.html', 'x');
    Folder::createPath(VfsForTest::dataDir . '/ws_1/UnitAttachments');
    file_put_contents(VfsForTest::dataDir . '/ws_1/UnitAttachments/scan.png', 'x');

    static::assertSame($hash, $workspace->getWorkspaceHash());
  }

  function test_getWorkspaceHash_changesWithTheFilesTheRescanReads(): void {
    $workspace = new Workspace(1);
    $hash = $workspace->getWorkspaceHash();

    file_put_contents(VfsForTest::dataDir . '/ws_1/Unit/NEW_UNIT.XML', '<Unit/>');
    $hashWithNewFile = $workspace->getWorkspaceHash();
    static::assertNotSame($hash, $hashWithNewFile);

    file_put_contents(VfsForTest::dataDir . '/ws_1/Unit/NEW_UNIT.XML', '<Unit></Unit>');
    static::assertNotSame($hashWithNewFile, $workspace->getWorkspaceHash());

    rename(VfsForTest::dataDir . '/ws_1/Unit/NEW_UNIT.XML', VfsForTest::dataDir . '/ws_1/Booklet/NEW_UNIT.XML');
    static::assertNotSame($hashWithNewFile, $workspace->getWorkspaceHash());
  }

  function test_getFilePath(): void {
    $workspace = new Workspace(1);

    static::assertSame(
      'ws_1/Resource/package/js/app.js',
      (string) $workspace->getFilePath('Resource', 'package/js/app.js')
    );
  }

  function test_getFilePath_rejectsUnknownTypeAndPathsLeavingTheTypeDirectory(): void {
    $workspace = new Workspace(1);

    static::assertNull($workspace->getFilePath('UnitAttachments', 'x.png'));
    static::assertNull($workspace->getFilePath('Resource', '../Testtakers/SAMPLE_TESTTAKERS.XML'));
    static::assertNull($workspace->getFilePath('Resource', '../../ws_2/Resource/x.html'));
    static::assertNull($workspace->getFilePath('Resource', '/etc/passwd'));
  }

  function test_getFileById_validXmlFile(): void {
    $this->workspaceDaoMock
      ->expects('getFileById')
      ->once()
      ->withArgs(['SYSCHECK.SAMPLE', 'SysCheck'])
      ->andReturn(VfsForTest::loadAndValidateFile('ws_1/SysCheck/SAMPLE_SYSCHECK.XML', 'SysCheck'));
    $workspace = new Workspace(1);

    $result = $workspace->getFileById('SysCheck', 'SYSCHECK.SAMPLE');

    static::assertEquals('XMLFileSysCheck', get_class($result));
    static::assertEquals('ws_1/SysCheck/SAMPLE_SYSCHECK.XML', (string) $result->getPath());
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
      ->andReturn(new FileData(StoragePath::fromString('ws_1/SysCheck/SAMPLE_SYSCHECK.XML'), 'SysCheck', 'SYSCHECK.SAMPLE', isValid: false));
    $workspace = new Workspace(1);

    $this->expectException("HttpError");
    $workspace->getFileById('SysCheck', 'SYSCHECK.SAMPLE');
  }
}
