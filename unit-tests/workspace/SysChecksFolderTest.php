<?php
/** @noinspection PhpUnhandledExceptionInspection */

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class SysChecksFolderTest extends TestCase {

    private vfsStreamDirectory $vfs;
    private SysChecksFolder $folder;

    public static function setUpBeforeClass(): void {

        require_once "unit-tests/VfsForTest.class.php";
        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
        require_once "classes/workspace/Workspace.class.php";
        require_once "classes/workspace/SysChecksFolder.class.php";
        require_once "classes/helper/FileName.class.php";
        require_once "classes/files/File.class.php";
        require_once "classes/files/XMLFile.class.php";
        require_once "classes/files/XMLFileSysCheck.class.php";

        $this->vfs = VfsForTest::setUp();
        $this->folder = new SysChecksFolder(1);
    }

    function test_findAvailableSysChecks() {

        $result = $this->folder->findAvailableSysChecks();
        $this->assertEquals(1, count($result));
        $this->assertEquals('SYSCHECK.SAMPLE', $result[0]->getId());
    }
}
