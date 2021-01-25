<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/workspace/Workspace.class.php";
require_once "classes/workspace/SysChecksFolder.class.php";
require_once "unit-tests/VfsForTest.class.php";


class SysChecksFolderTest extends TestCase {

    private $vfs;
    private $folder;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        $this->vfs = VfsForTest::setUp();
        $this->folder = new SysChecksFolder(1);
    }

    function test_findAvailableSysChecks() {

        $result = $this->folder->findAvailableSysChecks();
        $this->assertEquals(1, count($result));
        $this->assertEquals('SYSCHECK.SAMPLE', $result[0]->getId());
    }
}
