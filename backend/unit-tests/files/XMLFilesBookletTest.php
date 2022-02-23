<?php

use PHPUnit\Framework\TestCase;

require_once "src/data-collection/DataCollectionTypeSafe.class.php";
require_once "src/files/File.class.php";
require_once "src/files/XMLFile.class.php";
require_once "src/files/XMLFileBooklet.class.php";

class XMLFileBookletExposed extends XMLFileBooklet {

    public function getAllUnitIds(): array {
        return parent::getAllUnitIds();
    }
};


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class XMLFilesBookletTest extends TestCase {

    public static function setUpBeforeClass(): void {

        require_once "unit-tests/VfsForTest.class.php";
        VfsForTest::setUpBeforeClass();
    }


    public function setUp(): void {

        require_once "src/data-collection/DataCollectionTypeSafe.class.php";
        require_once "src/helper/FileName.class.php";
        require_once "src/helper/FileTime.class.php";
        require_once "src/files/File.class.php";
        require_once "src/files/XMLFile.class.php";
        require_once "src/files/XMLFileBooklet.class.php";

        VfsForTest::setUp();
    }


    function test_getAllUnitIds() {

        $xmlFile = new XMLFileBookletExposed(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML');

        $expected = ['UNIT.SAMPLE', 'UNIT.SAMPLE-2', 'UNIT.SAMPLE'];

        $result = $xmlFile->getAllUnitIds();

        $this->assertEquals($expected, $result);
    }
}


