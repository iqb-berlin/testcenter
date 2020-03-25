<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/helper/Expiration.class.php";
require_once "classes/exception/HttpError.class.php";

class ExpirationTest extends TestCase {

    function test_check() {

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
}
