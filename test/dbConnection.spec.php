<?php
use PHPUnit\Framework\TestCase;

class DatabaseTest extends TestCase {
    protected static $dbh;

    public static function setUpBeforeClass(): void {
        self::$dbh = new PDO('sqlite::memory:');
    }

    public static function tearDownAfterClass(): void {
        self::$dbh = null;
    }


    public function testOne() {
        $this->assertTrue(true);
    }

}
