<?php

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class ModeTest extends TestCase {
  function setUp(): void {
    require_once 'src/helper/Mode.class.php';
  }

  public function test_getWorkspaceName() {
    $result = Mode::withChildren('RW');
    $expectation = ['RW', 'RO'];
    $this->assertEquals($expectation, $result);

    $result = Mode::withChildren('RO');
    $expectation = ['RO'];
    $this->assertEquals($expectation, $result);

    $result = Mode::withChildren('not existing role');
    $expectation = [];
    $this->assertEquals($expectation, $result);
  }
}
