<?php
use PHPUnit\Framework\TestCase;

require_once "admin/classes/dao/DBConnection.php";
require_once "admin/classes/dao/DBConfig.class.php";

class DatabaseTest extends TestCase {

    private $dbc;
    /* @type DBConnection
     * @throws Exception
     */

    function setUp() {

        $this->dbc = new DBConnection(new DBConfig(array("type" => "temp")));
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql'); // TODO split database schema and test data
    }


    function tearDown() {

        unset($this->dbc);
    }

    public function testOne() {

        $this->assertEquals(array('2+2' => 4), $this->dbc->_("SELECT 2+2"));
    }

    public function test_getWorkspaceName() {

        $result = $this->dbc->getWorkspaceName(1);
        $expectation = 'example_workspace';
        $this->assertEquals($expectation, $result);
    }

}
