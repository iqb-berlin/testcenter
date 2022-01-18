<?php
/** @noinspection PhpIllegalPsrClassPathInspection */

use PHPUnit\Framework\TestCase;
use org\bovigo\vfs\vfsStream;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class WorkspaceTest extends TestCase {

    private $vfs;
    private $workspace;

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


    public static function setUpBeforeClass(): void {

        require_once "unit-tests/VfsForTest.class.php";
        VfsForTest::setUpBeforeClass();
    }


    function setUp(): void {

        require_once "unit-tests/mock-classes/ExternalFileMock.php";
        require_once "unit-tests/mock-classes/ZIPMock.php";
        require_once "unit-tests/mock-classes/PasswordMock.php";

        require_once "classes/helper/FileSize.class.php";
        require_once "classes/helper/Folder.class.php";
        require_once "classes/helper/FileName.class.php";
        require_once "classes/helper/Version.class.php";
        require_once "classes/helper/XMLSchema.class.php";
        require_once "classes/helper/JSON.class.php";
        require_once "classes/helper/TimeStamp.class.php";
        require_once "classes/exception/HttpError.class.php";
        require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
        require_once "classes/data-collection/ValidationReportEntry.class.php";
        require_once "classes/data-collection/PlayerMeta.class.php";
        require_once "classes/data-collection/FileSpecialInfo.class.php";
        require_once "classes/data-collection/Login.class.php";
        require_once "classes/data-collection/LoginArray.class.php";
        require_once "classes/data-collection/Group.class.php";
        require_once "classes/workspace/TesttakersFolder.class.php";
        require_once "classes/files/File.class.php";
        require_once "classes/files/ResourceFile.class.php";
        require_once "classes/files/XMLFile.class.php";
        require_once "classes/files/XMLFileUnit.class.php";
        require_once "classes/files/XMLFileTesttakers.class.php";
        require_once "classes/files/XMLFileBooklet.class.php";
        require_once "classes/files/XMLFileSysCheck.class.php";
        require_once "classes/workspace/WorkspaceValidator.class.php";

        $this->vfs = VfsForTest::setUp();
        $this->workspace = new Workspace(1);
    }


    function tearDown(): void {

        unset($this->vfs);
    }


    function test___construct() {

        $workspaceDirectories = scandir(vfsStream::url('root/vo_data'));
        $expectation = array('.', '..', 'ws_1');
        $this->assertEquals($expectation, $workspaceDirectories);

        $workspace1Directories = scandir(vfsStream::url('root/vo_data/ws_1'));
        $expectation = array('.', '..', 'Booklet', 'Resource', 'SysCheck', 'Testtakers', 'Unit');
        $this->assertEquals($expectation, $workspace1Directories);
    }

    function test_getWorkspacePath() {

        $result = $this->workspace->getWorkspacePath();
        $expectation = 'vfs://root/vo_data/ws_1';
        $this->assertEquals($expectation, $result);
    }

    function test_getAllFiles() {

        $result = $this->workspace->getFiles();

        $resultDigest = array_map(function(File $file) { return $file->getName(); }, $result);

        $expectation = [
            'SAMPLE_UNITCONTENTS.HTM',
            'verona-player-simple-4.0.0.html',
            'SAMPLE_UNIT.XML',
            'SAMPLE_UNIT2.XML',
            'SAMPLE_BOOKLET.XML',
            'SAMPLE_BOOKLET2.XML',
            'SAMPLE_BOOKLET3.XML',
            'trash.xml',
            'SAMPLE_TESTTAKERS.XML',
            'trash.xml',
            'SAMPLE_SYSCHECK.XML',
        ];

        $this->assertEquals($expectation, $resultDigest);
    }


    function test_deleteFiles() {

        /** @var $voDataDir \org\bovigo\vfs\vfsStreamContent */
        $voDataDir = $this->vfs->getChild('vo_data')->getChild('ws_1')->getChild('SysCheck');
        $voDataDir->chmod(0444);
        file_put_contents(DATA_DIR . '/ws_1/Resource/somePlayer.HTML', 'player content');

        $result = $this->workspace->deleteFiles([
            'Resource/verona-player-simple-4.0.0.html',
            'Resource/somePlayer.HTML',
            'SysCheck/SAMPLE_SYSCHECK.XML',
            'i_dont/even.exist',
            "SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON"
        ]);
        $expectation = [
            'deleted' => [
                'Resource/somePlayer.HTML',
                "SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON"
            ],
            'did_not_exist' => ['i_dont/even.exist'],
            'not_allowed' => ['SysCheck/SAMPLE_SYSCHECK.XML'],
            'was_used' => ['Resource/verona-player-simple-4.0.0.html']
        ];
        $this->assertEquals($expectation, $result);

        $resourcesLeft = scandir('vfs://root/vo_data/ws_1/Resource');
        $resourcesLeftExpected = [
            '.',
            '..',
            'SAMPLE_UNITCONTENTS.HTM',
            'verona-player-simple-4.0.0.html'
        ];
        $this->assertEquals($resourcesLeftExpected, $resourcesLeft);
    }


    function test_deleteFiles_rejectIfDependencies() {

        $result = $this->workspace->deleteFiles([
            'Resource/verona-player-simple-4.0.0.html',
        ]);
        $expectation = [
            'deleted' => [],
            'did_not_exist' => [],
            'not_allowed' => [],
            'was_used' => ['Resource/verona-player-simple-4.0.0.html']
        ];
        $this->assertEquals($expectation, $result, 'reject deleting, if file was used');


        $result = $this->workspace->deleteFiles([
            'Resource/SAMPLE_UNITCONTENTS.HTM',
            'Resource/verona-player-simple-4.0.0.html',
            'Testtakers/SAMPLE_TESTTAKERS.XML',
            'SysCheck/SAMPLE_SYSCHECK.XML'
        ]);
        $expectation = [
            'deleted' => [
                'Testtakers/SAMPLE_TESTTAKERS.XML',
                'SysCheck/SAMPLE_SYSCHECK.XML'
            ],
            'did_not_exist' => [],
            'not_allowed' => [],
            'was_used' => [
                'Resource/SAMPLE_UNITCONTENTS.HTM',
                'Resource/verona-player-simple-4.0.0.html',
            ]
        ];
        $this->assertEquals($expectation, $result, 'reject deleting, if file was used');
    }



    function test_countFilesOfAllSubFolders() {

        $expectation = [
            "Testtakers" => 2,
            "SysCheck" => 1,
            "Booklet" => 4,
            "Unit" => 2,
            "Resource" => 2
        ];

        $result = $this->workspace->countFilesOfAllSubFolders();
        $this->assertEquals($expectation, $result);
    }


    function test_importUnsortedFile() {

        file_put_contents(DATA_DIR . '/ws_1/valid.xml', self::validFile);
        file_put_contents(DATA_DIR . '/ws_1/Resource/P.HTML', "this would be a player");
        $result = $this->workspace->importUnsortedFile('valid.xml');
        $this->assertArrayNotHasKey('error', $result["valid.xml"]->getValidationReportSorted(), 'valid file has no errors');
        $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Unit/valid.xml'), 'valid file is imported');
        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid.xml'), 'cleanup after import');

        file_put_contents(DATA_DIR . '/ws_1/invalid.xml', self::invalidFile);
        $result = $this->workspace->importUnsortedFile('invalid.xml');
        $this->assertGreaterThan(0, count($result["invalid.xml"]->getValidationReportSorted()['error']), 'invalid file has error report');
        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/Unit/invalid.xml'), 'invalid file is rejected');
        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/invalid.xml'), 'cleanup after import');

        file_put_contents(DATA_DIR . '/ws_1/valid3.xml', self::validFile2);
        $result = $this->workspace->importUnsortedFile('valid3.xml');
        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/Unit/valid3.xml'), 'reject on duplicate id if file names are not the same');
        $this->assertStringContainsString(
            '1st valid file',
            file_get_contents(DATA_DIR . '/ws_1/Unit/valid.xml'),
            "don't overwrite on duplicate id if file names are not the same"
        );
        $this->assertGreaterThan(0, count($result["valid3.xml"]->getValidationReportSorted()['error']), 'return warning on duplicate id if file names are not the same');
        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid3.xml'), 'cleanup after import');

        file_put_contents(DATA_DIR . '/ws_1/valid.xml', self::validFile2);
        $result = $this->workspace->importUnsortedFile('valid.xml');
        $this->assertStringContainsString(
            '2nd valid file',
            file_get_contents(DATA_DIR . '/ws_1/Unit/valid.xml'),
            'allow overwriting if filename and id is the same'
        );
        $this->assertGreaterThan(0, count($result["valid.xml"]->getValidationReportSorted()['warning']), 'return warning if filename and id is the same');
        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/valid.xml'), 'cleanup after import');
    }


    function test_importUnsortedFile_zipWithValidFilesWithDependencies() {

        ZIP::$mockArchive = [
            'valid_testtakers.xml' => self::validTesttakers,
            'valid_booklet.xml' => self::validBooklet,
            'P.html' => 'this would be a player',
            'valid_unit.xml' => self::validUnit
        ];

        $result = $this->workspace->importUnsortedFile("archive.zip");
        $errors = $this->getErrorsFromValidationResult($result);

        $this->assertCount(0, $errors);

        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip_Extract'), 'clean after importing');
        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip'), 'clean after importing');

        $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Unit/valid_unit.xml'), 'import valid unit from ZIP');
        $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Booklet/valid_booklet.xml'), 'import valid booklet from ZIP');
        $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Resource/P.html'), 'import resource from ZIP');
        $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Testtakers/valid_testtakers.xml'), 'import testtakers from ZIP');
    }


    function test_importUnsortedFile_zip_rejectInvalidUnitAndDependantFiles() {

        ZIP::$mockArchive = [
            'valid_testtakers.xml' => self::validTesttakers,
            'valid_booklet.xml' => self::validBooklet,
            'P.html' => 'this would be a player',
            'invalid_unit.xml' => 'INVALID'
        ];

        $result = $this->workspace->importUnsortedFile("archive.zip");
        $errors = $this->getErrorsFromValidationResult($result);

        $this->assertCount(3, $errors);

        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip_Extract'), 'clean after importing');
        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip'), 'clean after importing');
        $this->assertFalse(
            file_exists($this->workspace->getWorkspacePath() . '/Unit/valid_unit.xml'),
            'don\'t import invalid Unit from ZIP'
        );
        $this->assertFalse(
            file_exists($this->workspace->getWorkspacePath() . '/Booklet/valid_booklet.xml'),
            'don\'t import Booklet dependant of invalid unit from ZIP'
        );
        $this->assertTrue(
            file_exists($this->workspace->getWorkspacePath() . '/Resource/P.html'),
            'import resource from ZIP'
        );
        $this->assertFalse(
            file_exists($this->workspace->getWorkspacePath() . '/Testtakers/valid_testtakers.xml'),
            'don\'t import Testtakers dependant of invalid unit from ZIP'
        );
    }


    function test_importUnsortedFile_zip_rejectInvalidBookletAndDependantFiles() {

        ZIP::$mockArchive = [
            'valid_testtakers.xml' => self::validTesttakers,
            'invalid_booklet.xml' => 'INVALID',
            'P.html' => 'this would be a player',
            'valid_unit.xml' => self::validUnit
        ];

        $result = $this->workspace->importUnsortedFile("archive.zip");
        $errors = $this->getErrorsFromValidationResult($result);

        $this->assertCount(2, $errors);

        //        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip_Extract'), 'clean after importing');
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


    function test_importUnsortedFile_zip_rejectOnDuplicateId() {

        ZIP::$mockArchive = [
            'file_with_used_id.xml' => '<Unit ><Metadata><Id>UNIT.SAMPLE</Id><Label>l</Label></Metadata><Definition player="p">d</Definition></Unit>',
        ];

        $result = $this->workspace->importUnsortedFile("archive.zip");
        $errors = $this->getErrorsFromValidationResult($result);

        $this->assertCount(1, $errors);

        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip_Extract'), 'clean after importing');
        $this->assertFalse(
            file_exists(DATA_DIR . '/ws_1/Unit/valid_unit.xml'),
            'reject file from ZIP on duplicate ID'
        );
    }


    function test_importUnsortedFile_zip_handleSubFolders() {

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

        $result = $this->workspace->importUnsortedFile("archive.zip");
        $errors = $this->getErrorsFromValidationResult($result);
        $this->assertCount(1, $errors);

        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/archive.zip_Extract'), 'clean after importing');
        $this->assertFalse(
            file_exists($this->workspace->getWorkspacePath() . '/Unit/invalid_unit.xml'),
            'don\'t import invalid Unit from ZIP'
        );
        $this->assertTrue(
            file_exists($this->workspace->getWorkspacePath() . '/Unit/valid_unit.xml'),
            'import invalid Unit from ZIP'
        );
        $this->assertTrue(
            file_exists($this->workspace->getWorkspacePath() . '/Booklet/valid_booklet.xml'),
            'import Booklet dependant of invalid unit from ZIP'
        );
        $this->assertTrue(
            file_exists($this->workspace->getWorkspacePath() . '/Resource/P.html'),
            'import resource from ZIP'
        );
        $this->assertTrue(
            file_exists($this->workspace->getWorkspacePath() . '/Testtakers/valid_testtakers.xml'),
            'import Testtakers dependant of invalid unit from ZIP'
        );
    }


    function getErrorsFromValidationResult($result): array {
        return array_filter(
            array_map(function($file) {
                return $file->getValidationReportSorted()['error'] ?? null;
            }, $result),
            'is_array'
        );
    }


    function test_findFileById() {

        $result = $this->workspace->findFileById('SysCheck', 'SYSCHECK.SAMPLE');
        $this->assertEquals('XMLFileSysCheck', get_class($result));
        $this->assertEquals('vfs://root/vo_data/ws_1/SysCheck/SAMPLE_SYSCHECK.XML', $result->getPath());

        try {
            $this->workspace->findFileById('SysCheck', 'not-existing-id');
            $this->fail("expected exception");
        } catch (Exception $exception) {}

        try {
            $this->workspace->findFileById('SysCheck', 'not-existing-id');
            $this->fail("expected exception");
        } catch (Exception $exception) {}

        try {
            $this->workspace->findFileById('not-existing-type', 'SYSCHECK.SAMPLE');
            $this->fail("expected exception");
        } catch (Exception $exception) {}

        $result = $this->workspace->findFileById('Resource', 'verona-player-simple-4.0.0.html', true);
        $this->assertEquals('ResourceFile', get_class($result));
        $this->assertEquals('vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.0.0.html', $result->getPath());

        $result = $this->workspace->findFileById('Resource', 'verona-player-simple-4.0.99.HTML', true);
        $this->assertEquals('ResourceFile', get_class($result));
        $this->assertEquals('vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.0.0.html', $result->getPath());

        copy('vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.0.0.html',
            'vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.0.99.html');

        $result = $this->workspace->findFileById('Resource', 'VERONA-PLAYER-SIMPLE-4.0.0.HTML', true);
        $this->assertEquals('ResourceFile', get_class($result));
        $this->assertEquals('vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.0.0.html', $result->getPath());

        $result = $this->workspace->findFileById('Resource', 'VERONA-PLAYER-SIMPLE-4.HTML', true);
        $this->assertEquals('ResourceFile', get_class($result));
        $this->assertEquals('vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.0.99.html', $result->getPath());

        unlink('vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.0.99.html');
        copy('vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.0.0.html',
            'vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.7.0.html');

        $result = $this->workspace->findFileById('Resource', 'VERONA-PLAYER-SIMPLE-4.0.0.HTML', true);
        $this->assertEquals('ResourceFile', get_class($result));
        $this->assertEquals('vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.0.0.html', $result->getPath());

        $result = $this->workspace->findFileById('Resource', 'VERONA-PLAYER-SIMPLE-4.1.0.HTML', true);
        $this->assertEquals('ResourceFile', get_class($result));
        $this->assertEquals('vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.7.0.html', $result->getPath());

        $result = $this->workspace->findFileById('Resource', 'VERONA-PLAYER-SIMPLE-4.0.7.HTML', true);
        $this->assertEquals('ResourceFile', get_class($result));
        $this->assertEquals('vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.7.0.html', $result->getPath());
    }


    function test_findFileById_newerMinorRequested() {
        copy('vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.0.0.html',
            'vfs://root/vo_data/ws_1/Resource/verona-player-simple-4.5.0.html');
        $this->expectException('HttpError');
        $this->workspace->findFileById('Resource', 'VERONA-PLAYER-SIMPLE-4.6.HTML', true);
    }


    function test_findFileById_wrongVersion() {

        $this->expectException('HttpError');
        $this->workspace->findFileById('Resource','VERONA-PLAYER-SIMPLE-400.HTML', false);
    }


    function test_findFileById_notExisting() {

        $this->expectException('HttpError');
        $this->workspace->findFileById('Resource','NOT-EXISTING-ID', false);
    }
}
