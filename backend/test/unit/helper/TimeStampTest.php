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
    static::assertEquals($realNow, $result);
    $fakeNow = 123456789;
    SystemConfig::$debug_useStaticTime = "@$fakeNow";
    $result = TimeStamp::now();
    static::assertEquals($fakeNow, $result);
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
      static::fail("Exception expected.");
    } catch (HttpError $exception) {
      static::assertEquals($exception->getCode(), 410);
    }

    try {
      TimeStamp::checkExpiration($today, $past);
      static::fail("Exception expected.");
    } catch (HttpError $exception) {
      static::assertEquals($exception->getCode(), 410);
    }

    try {
      TimeStamp::checkExpiration($future, 0);
      static::fail("Exception expected.");
    } catch (HttpError $exception) {
      static::assertEquals($exception->getCode(), 401);
    }

    try {
      TimeStamp::checkExpiration(0, $past);
      static::fail("Exception expected.");
    } catch (HttpError $exception) {
      static::assertEquals($exception->getCode(), 410);
    }

    SystemConfig::$debug_useStaticTime = "@$evenBefore";
    try {
      TimeStamp::checkExpiration($past, $future);
      static::fail("Exception expected - faked now is before past");
    } catch (HttpError $exception) {
      static::assertEquals($exception->getCode(), 401);
    }

  }

  function test_expirationFromNow() {
    $today = 1694085128; // works because test is fast and we don't count microseconds
    $past = (new DateTime('1.1.2000 12:00'))->getTimestamp();
    $future = (new DateTime('1.1.2030 12:00'))->getTimestamp();
    $aroundTwentyYears = 60 * 24 * 365 * 20;

    SystemConfig::$debug_useStaticTime = "@$today";

    $actual = TimeStamp::expirationFromNow($future, 0);
    static::assertEquals($future, $actual, 'expiration is 2030');

    $actual = TimeStamp::expirationFromNow($future, 10);
    static::assertEquals($today + 600, $actual, 'expiration is in ten minutes');

    $actual = TimeStamp::expirationFromNow($future, $aroundTwentyYears);
    static::assertEquals($future, $actual, 'expiration is in 20 years');

    $actual = TimeStamp::expirationFromNow(0, 10);
    static::assertEquals($today + 600, $actual, 'expiration is in 10 minutes');

    $actual = TimeStamp::expirationFromNow(0, 0);
    static::assertEquals(0, $actual, 'no expiration');

    $actual = TimeStamp::expirationFromNow($past, 0);
    static::assertEquals($past, $actual, 'expired timestamp');

    SystemConfig::$debug_useStaticTime = "@$past";
    $actual = TimeStamp::expirationFromNow($today, $aroundTwentyYears);
    static::assertEquals(1577444400, $actual, 'was expired around 20 years after $past');
  }

  function test_fromSQLFormat() {
    // The offset is part of the value, so the moment is absolute: 10:00 UTC, not 10:00 local time.
    static::assertEquals(1627552800, TimeStamp::fromSQLFormat('2021-07-29 10:00:00+00'));
    static::assertEquals(1627545600, TimeStamp::fromSQLFormat('2021-07-29 10:00:00+02'));
    static::assertEquals(1627552800, TimeStamp::fromSQLFormat('2021-07-29 10:00:00.744751+00'));
    static::assertEquals(0, TimeStamp::fromSQLFormat(false));
    static::assertEquals(1627545600, TimeStamp::fromSQLFormat(1627545600));
  }

  function test_fromSQLFormatRejectsUnreadableValue() {
    $this->expectException(Exception::class);
    TimeStamp::fromSQLFormat('yesterday afternoon');
  }

  function test_toSQLFormat() {
    static::assertEquals('2020-08-20 06:30:00+00:00', TimeStamp::toSQLFormat(1597905000));
    static::assertNull(TimeStamp::toSQLFormat(0));
  }

  function test_sqlFormatSurvivesRoundTrip() {
    static::assertEquals(1597905000, TimeStamp::fromSQLFormat(TimeStamp::toSQLFormat(1597905000)));
  }

  function test_toDisplayFormat() {
    static::assertEquals('2020-08-20 08:30:00', TimeStamp::toDisplayFormat(1597905000));
    static::assertNull(TimeStamp::toDisplayFormat(0));
  }

}
