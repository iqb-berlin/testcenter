<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class TimeStampTest extends TestCase {
  function setUp(): void {
    require_once "src/helper/TimeStamp.class.php";
    require_once "src/exception/HttpError.class.php";
    require_once "src/data-collection/ExpirationState.class.php";
    require_once "src/data-collection/ExpirationStateType.enum.php";

    date_default_timezone_set('Europe/Berlin');
    TimeStamp::setup();
  }

  function tearDown(): void {
    TimeStamp::setup();
  }

  function test_now() {
    $realNow = (new DateTime())->getTimestamp();
    $result = TimeStamp::now();
    $this->assertEquals($realNow, $result);

    $fakeNow = 123456789;
    TimeStamp::setup(null, "@$fakeNow");
    $result = TimeStamp::now();
    $this->assertEquals($fakeNow, $result);
  }

  function test_checkExpiration() {
    $today = (new DateTime())->getTimestamp();
    $past = (new DateTime('1.1.2000 12:00'))->getTimestamp();
    $future = (new DateTime('1.1.2030 12:00'))->getTimestamp();
    $evenBefore = (new DateTime('31.12.1999 23:59'))->getTimestamp();

    TimeStamp::checkExpiration($past, $future);

    TimeStamp::checkExpiration(0, 0);

    try {
      TimeStamp::checkExpiration($future, $today);
      $this->fail("Exception expected.");
    } catch (HttpError $exception) {
      $this->assertEquals($exception->getCode(), 410);
    }

    try {
      TimeStamp::checkExpiration($today, $past);
      $this->fail("Exception expected.");
    } catch (HttpError $exception) {
      $this->assertEquals($exception->getCode(), 410);
    }

    try {
      TimeStamp::checkExpiration($future, 0);
      $this->fail("Exception expected.");
    } catch (HttpError $exception) {
      $this->assertEquals($exception->getCode(), 401);
    }

    try {
      TimeStamp::checkExpiration(0, $past);
      $this->fail("Exception expected.");
    } catch (HttpError $exception) {
      $this->assertEquals($exception->getCode(), 410);
    }

    TimeStamp::setup(null, "@$evenBefore");
    try {
      TimeStamp::checkExpiration($past, $future);
      $this->fail("Exception expected - faked now is before past");
    } catch (HttpError $exception) {
      $this->assertEquals($exception->getCode(), 401);
    }

  }

  function test_expirationFromNow() {
    $today = (new DateTime())->getTimestamp(); // works because test is fast and we don't count microseconds
    $past = (new DateTime('1.1.2000 12:00'))->getTimestamp();
    $future = (new DateTime('1.1.2030 12:00'))->getTimestamp();
    $aroundTwentyYears = 60 * 24 * 365 * 20;

    $actual = TimeStamp::expirationFromNow($future, 0);
    $this->assertEquals($future, $actual, 'expiration is 2030');

    $actual = TimeStamp::expirationFromNow($future, 10);
    $this->assertEquals($today + 600, $actual, 'expiration is in ten minutes');

    $actual = TimeStamp::expirationFromNow($future, $aroundTwentyYears);
    $this->assertEquals($future, $actual, 'expiration is in 20 years');

    $actual = TimeStamp::expirationFromNow(0, 10);
    $this->assertEquals($today + 600, $actual, 'expiration is in 10 minutes');

    $actual = TimeStamp::expirationFromNow(0, 0);
    $this->assertEquals(0, $actual, 'no expiration');

    $actual = TimeStamp::expirationFromNow($past, 0);
    $this->assertEquals($past, $actual, 'expired timestamp');

    TimeStamp::setup(null, "@$past");
    $actual = TimeStamp::expirationFromNow($today, $aroundTwentyYears);
    $this->assertEquals(1577444400, $actual, 'was expired around 20 years after $past');
  }

  function test_fromSQLFormat() {
    $this->assertEquals(1627545600, TimeStamp::fromSQLFormat('2021-07-29 10:00:00'));
    $this->assertEquals(0, TimeStamp::fromSQLFormat(false));
    $this->assertEquals(1627545600, TimeStamp::fromSQLFormat(1627545600));
  }

}
