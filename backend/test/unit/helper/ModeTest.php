<?php

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class ModeTest extends TestCase {
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

  public function test_getByCapability() {
    // pins what the backend reads from definitions/testtaker/test-mode.json
    $this->assertEquals(
      ['run-demo', 'run-hot-restart', 'sys-check-login'],
      Mode::getByCapability(ModeCapability::ALWAYS_NEW_SESSION)
    );
    $this->assertEquals(
      ['run-hot-return', 'run-hot-restart', 'run-trial'],
      Mode::getByCapability(ModeCapability::MONITORABLE)
    );
    $this->assertEquals(
      ['monitor-group', 'monitor-study'],
      Mode::getByCapability(ModeCapability::LOCK_AFTER_FAILED_LOGINS)
    );
  }

  public function test_hasCapability() {
    $this->assertTrue(Mode::hasCapability('run-hot-return', ModeCapability::MONITORABLE));
    $this->assertTrue(Mode::hasCapability('RUN-HOT-RETURN', ModeCapability::MONITORABLE));
    $this->assertFalse(Mode::hasCapability('run-hot-return', ModeCapability::ALWAYS_NEW_SESSION));
    $this->assertFalse(Mode::hasCapability('not existing mode', ModeCapability::MONITORABLE));
  }
}
