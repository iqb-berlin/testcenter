<?php

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class FileTest extends TestCase {

    private vfsStreamDirectory $vfs;

    public static function setUpBeforeClass(): void {

        require_once "unit-tests/VfsForTest.class.php";
        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
        require_once "classes/data-collection/PlayerMeta.class.php";
        require_once "classes/data-collection/ValidationReportEntry.class.php";
        require_once "classes/helper/FileName.class.php";
        require_once "classes/files/File.class.php";
        require_once "classes/files/XMLFile.class.php";
        require_once "classes/files/XMLFileBooklet.class.php";
        require_once "classes/files/ResourceFile.class.php";

        $this->vfs = VfsForTest::setUp();
    }

    function test_get() {

        $file = File::get(DATA_DIR . '/Booklet/SAMPLE_BOOKLET.XML', 'Booklet');
        $this->assertEquals('XMLFileBooklet', get_class($file));

        $file = File::get(DATA_DIR . '/Resource/SAMPLE_PLAYER.HTML', 'Resource');
        $this->assertEquals('ResourceFile', get_class($file));
    }

    // most other functions are trivial or tested with specialized classes
}
