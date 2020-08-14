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

//        $expected = [
//            new Command('cmd#3', 'COMMAND_C'),
//            new Command('cmd#4', 'COMMAND_D', "param1", "param2"),
//        ];
//        $result = $this->dbc->getCommands(1, 'cmd#2');
//        $this->assertEquals($expected, $result);
//
//        $expected = [
//            new Command('cmd#1', 'COMMAND_A', "param1"),
//            new Command('cmd#2', 'COMMAND_B'),
//            new Command('cmd#3', 'COMMAND_C'),
//            new Command('cmd#4', 'COMMAND_D', "param1", "param2"),
//        ];
//        $result = $this->dbc->getCommands(1);
//        $this->assertEquals($expected, $result);

        $expected = [
            new Command('cmd#X', 'COMMAND_X')
        ];
        $result = $this->dbc->getCommands(2);
        $this->assertEquals($expected, $result, 'second test');

//        $expected = [];
//        $result = $this->dbc->getCommands(3);
//        $this->assertEquals($expected, $result);
//
//        $expected = [];
//        $result = $this->dbc->getCommands(1, 'COMMAND_X');
//        $this->assertEquals($expected, $result);
    }
}
