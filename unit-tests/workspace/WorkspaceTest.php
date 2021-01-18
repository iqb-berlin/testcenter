<?php
/** @noinspection PhpIllegalPsrClassPathInspection */

use PHPUnit\Framework\TestCase;
use org\bovigo\vfs\vfsStream;

require_once "unit-tests/VfsForTest.class.php";
require_once "unit-tests/mock-classes/VersionMock.php";
require_once "unit-tests/mock-classes/ExternalFileMock.php";

require_once "classes/helper/FileSize.class.php";
require_once "classes/helper/Folder.class.php";
require_once "classes/helper/FileName.class.php";
require_once "classes/helper/XMLSchema.class.php";
require_once "classes/exception/HttpError.class.php";
require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
require_once "classes/data-collection/ValidationReportEntry.class.php";
require_once "classes/files/File.class.php";
require_once "classes/files/ResourceFile.class.php";
require_once "classes/files/XMLFile.class.php";
require_once "classes/files/XMLFileUnit.class.php";
require_once "classes/files/XMLFileTesttakers.class.php";
require_once "classes/files/XMLFileBooklet.class.php";
require_once "classes/files/XMLFileSysCheck.class.php";
require_once "classes/workspace/WorkspaceValidator.class.php";


class WorkspaceTest extends TestCase {

    private $vfs;
    private $workspace;

    private $validFile = '<Unit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://raw.githubusercontent.com/iqb-berlin/testcenter-backend/5.0.1/definitions/vo_Unit.xsd">'
        . '<Metadata><Id>id</Id><Label>l</Label></Metadata><Definition player="p">1st valid file</Definition></Unit>';
    private $invalidFile = '<Unit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://raw.githubusercontent.com/iqb-berlin/testcenter-backend/5.0.1/definitions/vo_Unit.xsd">'
        . "<Metadata><Id>id</Id></Metadata></Unit>";
    private $validFile2 = '<Unit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://raw.githubusercontent.com/iqb-berlin/testcenter-backend/5.0.1/definitions/vo_Unit.xsd">'
    . '<Metadata><Id>id</Id><Label>l</Label></Metadata><Definition player="p">2nd valid file</Definition></Unit>';

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

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
            'verona-simple-player-1.html',
            'SAMPLE_UNIT.XML',
            'SAMPLE_UNIT2.XML',
            'SAMPLE_BOOKLET.XML',
            'SAMPLE_BOOKLET2.XML',
            'trash.xml',
            'SAMPLE_TESTTAKERS.XML',
            'trash.xml',
            'SAMPLE_SYSCHECK.XML',
        ];

        $this->assertEquals($expectation, $resultDigest);
    }


    function test_deleteFiles() {

        $this->vfs->getChild('vo_data')->getChild('ws_1')->getChild('SysCheck')->chmod(0000);

        $result = $this->workspace->deleteFiles(array(
            'Resource/verona-simple-player-1.html',
            'SysCheck/SAMPLE_SYSCHECK.XML',
            'i_dont/even.exist'
        ));

        $resources = scandir('vfs://root/vo_data/ws_1/Resource');
        $expectation = array(
            'deleted' => array('Resource/verona-simple-player-1.html'),
            'did_not_exist' => array('i_dont/even.exist'),
            'not_allowed' => array('SysCheck/SAMPLE_SYSCHECK.XML')
        );

        $this->assertEquals($expectation, $result);
        $this->assertEquals($resources, array('.', '..', 'SAMPLE_UNITCONTENTS.HTM'));
    }


    function test_countFilesOfAllSubFolders() {

        $expectation = [
            "Testtakers" => 2,
            "SysCheck" => 1,
            "Booklet" => 3,
            "Unit" => 2,
            "Resource" => 2
        ];

        $result = $this->workspace->countFilesOfAllSubFolders();
        $this->assertEquals($expectation, $result);
    }


    function test_importUnsortedResource() {

        file_put_contents(DATA_DIR . '/ws_1/valid.xml', $this->validFile);
        file_put_contents(DATA_DIR . '/ws_1/Resource/P.HTML', "this would be a player");
        $result = $this->workspace->importUnsortedFile('valid.xml');
        $expectation = ["valid.xml" => []];
        $this->assertEquals($expectation, $result, 'valid file has no report');
        $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Unit/valid.xml'), 'valid file is imported');

        file_put_contents(DATA_DIR . '/ws_1/invalid.xml', $this->invalidFile);
        $result = $this->workspace->importUnsortedFile('invalid.xml');
        $this->assertGreaterThan(0, count($result["invalid.xml"]['error']), 'invalid file has error report');
        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/Unit/invalid.xml'), 'invalid file is rejected');

        file_put_contents(DATA_DIR . '/ws_1/valid3.xml', $this->validFile2);
        $result = $this->workspace->importUnsortedFile('valid3.xml');
        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/Unit/valid3.xml'), 'reject on duplicate id if file names are not the same');
        $this->assertStringContainsString(
            '1st valid file',
            file_get_contents(DATA_DIR . '/ws_1/Unit/valid.xml'),
            "don't overwrite on duplicate id if file names are not the same"
        );
        $this->assertGreaterThan(0, count($result["valid3.xml"]['error']), 'return warning on duplicate id if file names are not the same');

        file_put_contents(DATA_DIR . '/ws_1/valid.xml', $this->validFile2);
        $result = $this->workspace->importUnsortedFile('valid.xml');
        $this->assertStringContainsString(
            '2nd valid file',
            file_get_contents(DATA_DIR . '/ws_1/Unit/valid.xml'),
            'allow overwriting if filename and id is the same'
        );
        $this->assertGreaterThan(0, count($result["valid.xml"]['warning']), 'return warning if filename and id is the same');

        // Zip-Archive import can not be tested, because
        // ext/zip does not support userland stream wrappers - so no vfs-support
        // see https://github.com/bovigo/vfsStream/wiki/Known-Issues
        // TODO find a solution to test ZIP-import
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

        $result = $this->workspace->findFileById('Resource', 'VERONA-SIMPLE-PLAYER-1.HTML', true);
        $this->assertEquals('ResourceFile', get_class($result));
        $this->assertEquals('vfs://root/vo_data/ws_1/Resource/verona-simple-player-1.html', $result->getPath());
    }


    function test_findFileById_wrongVersion() {

        $this->expectException('HttpError');
        $this->workspace->findFileById('Resource','VERONA-SIMPLE-PLAYER-2.HTML', false);
    }


    function test_findFileById_notExisting() {

        $this->expectException('HttpError');
        $this->workspace->findFileById('Resource','NOT-EXISTING-ID', false);
    }
}
