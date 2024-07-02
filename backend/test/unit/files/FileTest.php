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

    $file = File::get(DATA_DIR . '/ws_1/Resource/verona-player-simple-6.0.html', 'Resource');
    $this->assertEquals('ResourceFile', get_class($file));
  }

  function test_Report() {
    $file = File::get(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML', 'Booklet');

    $file->report('error', '1st error');
    $file->report('error', '2nd error');
    $file->report('error', '3th error');
    $file->report('error', '4th error');

    $this->assertEquals(
      [
        'error' => ['1st error', '2nd error', '3th error', '4th error']
      ],
      $file->getValidationReport()
    );

    $file->report('error', '5th error');

    $this->assertEquals(
      [
        'error' => ['1st error', '2nd error', '3th error', '4th error', '5th error']
      ],
      $file->getValidationReport()
    );

    $file->report('error', '6th error');

    $this->assertEquals(
      [
        'error' => ['1st error', '2nd error', '3th error', '4th error', '2 more errors.']
      ],
      $file->getValidationReport()
    );

    for ($i = 7; $i <= 200; $i++) {
      $file->report('error', 'error # ' . $i);
    }

    $this->assertEquals(
      [
        'error' => ['1st error', '2nd error', '3th error', '4th error', '196 more errors.']
      ],
      $file->getValidationReport()
    );

    $file->report('warning', '1st warning');

    $this->assertEquals(
      [
        'error' => ['1st error', '2nd error', '3th error', '4th error', '196 more errors.'],
        'warning' => ['1st warning']
      ],
      $file->getValidationReport()
    );

    for ($i = 2; $i <= 200; $i++) {
      $file->report('warning', 'warning # ' . $i);
    }

    $this->assertEquals(
      [
        'error' => ['1st error', '2nd error', '3th error', '4th error', '196 more errors.'],
        'warning' => ['1st warning', 'warning # 2', 'warning # 3', 'warning # 4', '196 more warnings.']
      ],
      $file->getValidationReport()
    );
  }

  // most other functions are trivial or tested with specialized classes
}
