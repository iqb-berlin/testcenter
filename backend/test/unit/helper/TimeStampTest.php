<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class TimeStampTest extends TestCase {
  function setUp(): void {
    date_default_timezone_set(SystemConfig::$system_timezone);
  }

  function test_now() {
    $realNow = (new DateTime())->getTimestamp();
    $result = TimeStamp::now();
    $this->assertEquals($realNow, $result);
    $fakeNow = 123456789;
    SystemConfig::$debug_useStaticTime = "@$fakeNow";
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

    SystemConfig::$debug_useStaticTime = "@$evenBefore";
    try {
      TimeStamp::checkExpiration($past, $future);
      $this->fail("Exception expected - faked now is before past");
    } catch (HttpError $exception) {
      $this->assertEquals($exception->getCode(), 401);
    }

  }

  function test_expirationFromNow() {
    $today = 1694085128; // works because test is fast and we don't count microseconds
    $past = (new DateTime('1.1.2000 12:00'))->getTimestamp();
    $future = (new DateTime('1.1.2030 12:00'))->getTimestamp();
    $aroundTwentyYears = 60 * 24 * 365 * 20;

    SystemConfig::$debug_useStaticTime = "@$today";

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

    SystemConfig::$debug_useStaticTime = "@$past";
    $actual = TimeStamp::expirationFromNow($today, $aroundTwentyYears);
    $this->assertEquals(1577444400, $actual, 'was expired around 20 years after $past');
  }

  function test_fromSQLFormat() {
    // The offset is part of the value, so the moment is absolute: 10:00 UTC, not 10:00 local time.
    $this->assertEquals(1627552800, TimeStamp::fromSQLFormat('2021-07-29 10:00:00+00'));
    $this->assertEquals(1627545600, TimeStamp::fromSQLFormat('2021-07-29 10:00:00+02'));
    $this->assertEquals(1627552800, TimeStamp::fromSQLFormat('2021-07-29 10:00:00.744751+00'));
    $this->assertEquals(0, TimeStamp::fromSQLFormat(false));
    $this->assertEquals(1627545600, TimeStamp::fromSQLFormat(1627545600));
  }

  function test_fromSQLFormatRejectsUnreadableValue() {
    $this->expectException(Exception::class);
    TimeStamp::fromSQLFormat('yesterday afternoon');
  }

  function test_toSQLFormat() {
    $this->assertEquals('2020-08-20 06:30:00+00:00', TimeStamp::toSQLFormat(1597905000));
    $this->assertNull(TimeStamp::toSQLFormat(0));
  }

  function test_sqlFormatSurvivesRoundTrip() {
    $this->assertEquals(1597905000, TimeStamp::fromSQLFormat(TimeStamp::toSQLFormat(1597905000)));
  }

  function test_toDisplayFormat() {
    $this->assertEquals('2020-08-20 08:30:00', TimeStamp::toDisplayFormat(1597905000));
    $this->assertNull(TimeStamp::toDisplayFormat(0));
  }

}
