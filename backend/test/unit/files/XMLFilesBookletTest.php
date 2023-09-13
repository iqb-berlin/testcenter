<?php

use PHPUnit\Framework\TestCase;

class XMLFileBookletExposed extends XMLFileBooklet {

  public function getUnitIds(bool $useAlias = false): array {
    return parent::getUnitIds();
  }
}
;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class XMLFilesBookletTest extends TestCase {
  public static function setUpBeforeClass(): void {
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
  }

  public function setUp(): void {
    require_once "src/data-collection/DataCollectionTypeSafe.class.php";
    require_once "src/helper/FileTime.class.php";
    require_once "src/helper/XMLSchema.class.php";
    require_once "src/helper/JSON.class.php";
    require_once "src/files/File.class.php";
    require_once "src/files/XMLFile.class.php";
    require_once "src/files/XMLFileBooklet.class.php";
    require_once "test/unit/mock-classes/ExternalFileMock.php";

    VfsForTest::setUp();
  }

  function test_getAllUnitIds() {
    $xmlFile = new XMLFileBookletExposed(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML');

    $expected = ['UNIT.SAMPLE', 'UNIT.SAMPLE-2', 'UNIT.SAMPLE'];

    $result = $xmlFile->getUnitIds();

    $this->assertEquals($expected, $result);
  }
}


