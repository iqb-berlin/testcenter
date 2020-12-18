<?php
/** @noinspection PhpIllegalPsrClassPathInspection */

use PHPUnit\Framework\TestCase;
use org\bovigo\vfs\vfsStream;

require_once "classes/helper/FileSize.class.php";
require_once "classes/helper/Folder.class.php";
require_once "classes/files/ResourceFile.class.php";
require_once "classes/files/XMLFile.php";
require_once "classes/files/XMLFileTesttakers.php";
require_once "unit-tests/VfsForTest.class.php";

class WorkspaceTest extends TestCase {

    private $vfs;
    private $workspace;

    private $validFile = "<Unit><Metadata><Id>id</Id><Label>l</Label></Metadata><Definition player='p'>d</Definition></Unit>";
    private $invalidFile = "<Unit><Metadata><Id>id</Id></Metadata></Unit>";

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
            'SAMPLE_TESTTAKERS.XML',
            'trash.xml',
            'SAMPLE_SYSCHECK.XML',
            'SAMPLE_BOOKLET.XML',
            'SAMPLE_BOOKLET2.XML',
            'trash.xml',
            'SAMPLE_UNIT.XML',
            'SAMPLE_UNIT2.XML',
            'SAMPLE_PLAYER.HTML'
        ];

        $this->assertEquals($expectation, $resultDigest);
    }


    function test_deleteFiles() {

        $this->vfs->getChild('vo_data')->getChild('ws_1')->getChild('SysCheck')->chmod(0000);

        $result = $this->workspace->deleteFiles(array(
            'Resource/SAMPLE_PLAYER.HTML',
            'SysCheck/SAMPLE_SYSCHECK.XML',
            'i_dont/even.exist'
        ));

        $resources = scandir('vfs://root/vo_data/ws_1/Resource');
        $expectation = array(
            'deleted' => array('Resource/SAMPLE_PLAYER.HTML'),
            'did_not_exist' => array('i_dont/even.exist'),
            'not_allowed' => array('SysCheck/SAMPLE_SYSCHECK.XML')
        );

        $this->assertEquals($expectation, $result);
        $this->assertEquals($resources, array('.', '..'));
    }


    function test_countFilesOfAllSubFolders() {

        $expectation = [
            "Testtakers" => 2,
            "SysCheck" => 1,
            "Booklet" => 3,
            "Unit" => 2,
            "Resource" => 1
        ];

        $result = $this->workspace->countFilesOfAllSubFolders();
        $this->assertEquals($expectation, $result);
    }


    function test_importUnsortedResource() {

        file_put_contents(DATA_DIR . '/ws_1/valid.xml', $this->validFile);
        $result = $this->workspace->importUnsortedResource('valid.xml');
        $expectation = ["valid.xml" => true];
        $this->assertEquals($expectation, $result);
        $this->assertTrue(file_exists(DATA_DIR . '/ws_1/Unit/valid.xml'));

        file_put_contents(DATA_DIR . '/ws_1/invalid.xml', $this->invalidFile);
        try {
            $this->workspace->importUnsortedResource('invalid.xml');
            $this->fail("expected exception");
        } catch (Exception $exception) {}
        $this->assertFalse(file_exists(DATA_DIR . '/ws_1/Unit/invalid.xml'));

        // Zip-Archive import can not be tesed, bevause
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

        $result = $this->workspace->findFileById('Resource', 'SAMPLE_PLAYER.1.HTML', true);
        $this->assertEquals('ResourceFile', get_class($result));
        $this->assertEquals('vfs://root/vo_data/ws_1/Resource/SAMPLE_PLAYER.HTML', $result->getPath());

        $result = $this->workspace->findFileById('Resource','SAMPLE_PLAYER.HTML', true);
        $this->assertEquals('ResourceFile', get_class($result));
        $this->assertEquals('vfs://root/vo_data/ws_1/Resource/SAMPLE_PLAYER.HTML', $result->getPath());

        try {
            $this->workspace->findFileById('Resource','SAMPLE_PLAYER.1.HTML', false);
            $this->fail("expected exception");
        } catch (Exception $exception) {}

        try {
            $this->workspace->findFileById('Resource','not-existing-id', true);
            $this->fail("expected exception");
        } catch (Exception $exception) {}
    }
}
