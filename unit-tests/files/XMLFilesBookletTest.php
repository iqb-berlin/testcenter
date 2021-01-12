<?php

use PHPUnit\Framework\TestCase;

require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
require_once "classes/files/File.class.php";
require_once "classes/files/XMLFile.class.php";
require_once "classes/files/XMLFileBooklet.class.php";



class XMLFileBookletExposed extends XMLFileBooklet {

    public function getAllUnitIds(): array {
        return parent::getAllUnitIds();
    }
};


class XMLFilesBookletTest extends TestCase {

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
        VfsForTest::setUp();
    }


    function test_getAllUnitIds() {

        $xmlFile = new XMLFileBookletExposed(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML');

        $expected = ['UNIT.SAMPLE', 'UNIT.SAMPLE-2'];

        $result = $xmlFile->getAllUnitIds();

        $this->assertEquals($expected, $result);
    }
}


