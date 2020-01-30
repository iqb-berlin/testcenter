<?php
use PHPUnit\Framework\TestCase;

require_once "admin/classes/dao/DBConnection.php";
require_once "admin/classes/dao/DBConfig.class.php";

class DatabaseTest extends TestCase {

//    protected static $dbh;

    private $dbc;
    /* @type DBConnection
     * @throws Exception
     */

//    public static function setUpBeforeClass(): void {
//        self::$dbh = new PDO('sqlite::memory:');
//    }
//
//    public static function tearDownAfterClass(): void {
//        self::$dbh = null;
//    }

    function setUp() {

        $this->dbc = new DBConnection(new DBConfig(array("type" => "temp")));
    }


    function tearDown() {
        // delete your instance
        unset($this->dbc);
    }

    public function testOne() {

        $this->assertEquals(array('2+2' => 4), $this->dbc->_("SELECT 2+2"));
    }

}
