<?php

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class ModeTest extends TestCase {
  public function test_getByCapability() {
    // pins what the backend reads from definitions/testtaker/test-mode.json
    static::assertEquals(
      ['run-demo', 'run-hot-restart', 'sys-check-login'],
      Mode::getByCapability(ModeCapability::ALWAYS_NEW_SESSION)
    );
    static::assertEquals(
      ['run-hot-return', 'run-hot-restart', 'run-trial'],
      Mode::getByCapability(ModeCapability::MONITORABLE)
    );
    static::assertEquals(
      ['run-review', 'run-trial'],
      Mode::getByCapability(ModeCapability::CAN_REVIEW)
    );
    static::assertEquals(
      ['monitor-group', 'monitor-study'],
      Mode::getByCapability(ModeCapability::LOCK_AFTER_FAILED_LOGINS)
    );
  }

  public function test_hasCapability() {
    static::assertTrue(Mode::hasCapability('run-hot-return', ModeCapability::MONITORABLE));
    static::assertTrue(Mode::hasCapability('RUN-HOT-RETURN', ModeCapability::MONITORABLE));
    static::assertFalse(Mode::hasCapability('run-hot-return', ModeCapability::ALWAYS_NEW_SESSION));
    static::assertFalse(Mode::hasCapability('not existing mode', ModeCapability::MONITORABLE));
  }
}
