<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/exception/HttpError.class.php";
require_once "classes/data-collection/DataCollection.class.php";
require_once "classes/helper/DB.class.php";
require_once "classes/data-collection/DBConfig.class.php";
require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
require_once "classes/data-collection/Command.class.php";
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

//        print_r($this->dbc->getDBContentDump());
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


    function test_getCommands() {


        $expected = [
            new Command(1, 'COMMAND_C', 1597903000),
            new Command(3, 'COMMAND_D', 1597904000, "param1", "param2"),
        ];
        $result = $this->dbc->getCommands(1, 4);

        $this->assertEquals($expected, $result);

        $expected = [
            new Command(2, 'COMMAND_A', 1597900000, "param1"),
            new Command(4, 'COMMAND_B', 1597901000),
            new Command(1, 'COMMAND_C', 1597903000),
            new Command(3, 'COMMAND_D', 1597904000, "param1", "param2"),
        ];
        $result = $this->dbc->getCommands(1);

        $this->assertEquals($expected, $result);

        $expected = [
            new Command(1, 'COMMAND_X', 1597902000)
        ];
        $result = $this->dbc->getCommands(2);
        $this->assertEquals($expected, $result);

        $expected = [];
        $result = $this->dbc->getCommands(3);
        $this->assertEquals($expected, $result);

        $expected = [];
        $result = $this->dbc->getCommands(1, 3);
        $this->assertEquals($expected, $result);
    }
}
