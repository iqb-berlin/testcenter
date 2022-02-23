<?php
/** @noinspection PhpUnhandledExceptionInspection */

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class SysChecksFolderTest extends TestCase {

    private SysChecksFolder $folder;

    public static function setUpBeforeClass(): void {

        require_once "unit-tests/VfsForTest.class.php";
        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        require_once "src/data-collection/DataCollectionTypeSafe.class.php";
        require_once "src/workspace/Workspace.class.php";
        require_once "src/workspace/SysChecksFolder.class.php";
        require_once "src/helper/FileName.class.php";
        require_once "src/helper/FileTime.class.php";
        require_once "src/files/File.class.php";
        require_once "src/files/XMLFile.class.php";
        require_once "src/files/XMLFileSysCheck.class.php";

        $this->workspaceDaoMock = Mockery::mock('overload:' . WorkspaceDAO::class);
        $this->workspaceDaoMock->allows([
            'getGlobalIds' => VfsForTest::globalIds
        ]);
        VfsForTest::setUp();
        $this->folder = new SysChecksFolder(1);
    }

    function test_findAvailableSysChecks() {

        $result = $this->folder->findAvailableSysChecks();
        $this->assertEquals(1, count($result));
        $this->assertEquals('SYSCHECK.SAMPLE', $result[0]->getId());
    }
}
