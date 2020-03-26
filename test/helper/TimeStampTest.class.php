<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/helper/TimeStamp.class.php";
require_once "classes/exception/HttpError.class.php";

class TimeStampTest extends TestCase {

    function test_checkExpiration() {

        $today = (new DateTime())->getTimestamp();
        $past = (new DateTime('1.1.2000 12:00'))->getTimestamp();
        $future = (new DateTime('1.1.2030 12:00'))->getTimestamp();

        TimeStamp::checkExpiration($past, $future);

        TimeStamp::checkExpiration(0, 0);

        try {
            TimeStamp::checkExpiration($future, $today);
            $this->fail("Exception expected.");
        } catch (HttpError $exception) {
            $this->assertEquals($exception->getCode(), 401);
        }

        try {
            TimeStamp::checkExpiration($today, $past);
            $this->fail("Exception expected.");
        } catch (HttpError $exception) {
            $this->assertEquals($exception->getCode(), 401);
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
            $this->assertEquals($exception->getCode(), 401);
        }
    }


    function test_expirationFromNow() {

        $today = (new DateTime())->getTimestamp(); // works because test is fast and we don't count microseconds
        $past = (new DateTime('1.1.2000 12:00'))->getTimestamp();
        $future = (new DateTime('1.1.2030 12:00'))->getTimestamp();
        $aroundTwentyYears = 60 * 24 * 365 * 20;

        $actual = TimeStamp::expirationFromNow($future,0);
        $this->assertEquals($future, $actual, 'expiration is 2030');

        $actual = TimeStamp::expirationFromNow($future,10);
        $this->assertEquals($today + 600, $actual, 'expiration is in ten minutes');

        $actual = TimeStamp::expirationFromNow($future, $aroundTwentyYears);
        $this->assertEquals($future, $actual, 'expiration is in 10 years');

        $actual = TimeStamp::expirationFromNow(0,10);
        $this->assertEquals($today + 600, $actual, 'expiration is in 10 minutes');

        $actual = TimeStamp::expirationFromNow(0,0);
        $this->assertEquals(0, $actual, 'no expiration');

        $actual = TimeStamp::expirationFromNow($past,0);
        $this->assertEquals($past, $actual, 'expired timestamp');
    }

}
