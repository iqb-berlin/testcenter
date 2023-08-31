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
    VfsForTest::setUp();
  }

  function test_get() {
    $file = File::get(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML', 'Booklet');
    $this->assertEquals('XMLFileBooklet', get_class($file));

    $file = File::get(DATA_DIR . '/ws_1/Resource/verona-player-simple-4.0.0.html', 'Resource');
    $this->assertEquals('ResourceFile', get_class($file));
  }

  // most other functions are trivial or tested with specialized classes
}
