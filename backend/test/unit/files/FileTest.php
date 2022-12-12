<?php

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class FileTest extends TestCase {

    public static function setUpBeforeClass(): void {
        require_once "test/unit/VfsForTest.class.php";
        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        require_once "src/data-collection/DataCollectionTypeSafe.class.php";
        require_once "src/data-collection/VeronaModuleMeta.class.php";
        require_once "src/data-collection/ValidationReportEntry.class.php";
        require_once "src/helper/FileName.class.php";
        require_once "src/helper/FileExt.class.php";
        require_once "src/data-collection/FileData.class.php";
        require_once "src/files/File.class.php";
        require_once "src/files/XMLFile.class.php";
        require_once "src/files/XMLFileBooklet.class.php";
        require_once "src/files/ResourceFile.class.php";

        VfsForTest::setUp();
    }

    function test_get() {

        $file = File::get(DATA_DIR . '/Booklet/SAMPLE_BOOKLET.XML', 'Booklet');
        $this->assertEquals('XMLFileBooklet', get_class($file));

        $file = File::get(DATA_DIR . '/Resource/SAMPLE_PLAYER.HTML', 'Resource');
        $this->assertEquals('ResourceFile', get_class($file));
    }

    // most other functions are trivial or tested with specialized classes
}
