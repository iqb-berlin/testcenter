<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/exception/HttpError.class.php";
require_once "classes/data-collection/DataCollection.class.php";
require_once "classes/helper/DB.class.php";
require_once "classes/data-collection/DBConfig.class.php";
//require_once "classes/helper/TimeStamp.class.php";
require_once "classes/dao/DAO.class.php";
require_once "classes/dao/TestDAO.class.php";


class TestDAOTest extends TestCase {

    private $dbc;
    /* @type DAO
     * @throws Exception
     */

    function setUp() {

        DB::connect(new DBConfig(["type" => "temp"]));
        $this->dbc = new TestDAO();
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql');
        $this->dbc->runFile('unit-tests/testdata.sql');
    }


    function tearDown() {

        unset($this->dbc);
    }


    function test_getTestLastState() {

        $expected = (object) ['LASTUNIT' => '1'];
        $result = $this->dbc->getTestLastState(1);

        $this->assertEquals($expected, $result);

        $expected = (object) [];
        $result = $this->dbc->getTestLastState(2);

        $this->assertEquals($expected, $result);

    }
}
