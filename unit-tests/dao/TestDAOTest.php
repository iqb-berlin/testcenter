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

    function setUp(): void {

        DB::connect(new DBConfig(["type" => "temp"]));
        $this->dbc = new TestDAO();
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql');
        $this->dbc->runFile('unit-tests/testdata.sql');
    }


    function tearDown(): void {

//        print_r($this->dbc->getDBContentDump());
        unset($this->dbc);
    }


    function test_getTestState() {

        $expected = ['CURRENT_UNIT_ID' => 'UNIT_1'];
        $result = $this->dbc->getTestState(1);

        $this->assertEquals($expected, $result);

        $expected = [];
        $result = $this->dbc->getTestState(2);

        $this->assertEquals($expected, $result);
    }


    function test_getUnitState() {

        $expected = ["SOME_STATE" => "WHATEVER"];
        $result = $this->dbc->getUnitState(1, 'UNIT_1');
        $this->assertEquals($expected, $result);

        $expected = [];
        $result = $this->dbc->getUnitState(999, 'UNIT_1');
        $this->assertEquals($expected, $result);

        $expected = [];
        $result = $this->dbc->getUnitState(1, 'not_existing_unit');
        $this->assertEquals($expected, $result);
    }


    function test_updateTestState() {

        $testState = [
            "some_entry" => 'some_content',
            "with_encoded_json_content" => '{"a":"b"}',
        ];

        $expected = [
            'CURRENT_UNIT_ID' => 'UNIT_1',
            'some_entry' => 'some_content',
            'with_encoded_json_content' => '{"a":"b"}'
        ];

        $result = $this->dbc->updateTestState(1, $testState);
        $this->assertEquals($expected, $result);

        $resultFromGet = $this->dbc->getTestState(1);
        $this->assertEquals($result, $resultFromGet);

        $updateState = [
            "some_entry" => 'new_content',
            "new_entry" => 'anything',
        ];

        $expectedAfterUpdate = [
            'CURRENT_UNIT_ID' => 'UNIT_1',
            'some_entry' => 'new_content',
            'with_encoded_json_content' => '{"a":"b"}',
            "new_entry" => 'anything'
        ];

        $resultAfterUpdate = $this->dbc->updateTestState(1, $updateState);
        $this->assertEquals($expectedAfterUpdate, $resultAfterUpdate);

        $resultFromGetAfterUpdate = $this->dbc->getTestState(1);
        $this->assertEquals($resultAfterUpdate, $resultFromGetAfterUpdate);
    }


    function test_updateUnitState() {

        $testState = [
            "some_entry" => 'some_content',
            "with_encoded_json_content" => '{"a":"b"}',
        ];

        $expected = [
            'SOME_STATE' => 'WHATEVER',
            'some_entry' => 'some_content',
            'with_encoded_json_content' => '{"a":"b"}'
        ];

        $result = $this->dbc->updateUnitState(1, 'UNIT_1', $testState);
        $this->assertEquals($expected, $result);

        $resultFromGet = $this->dbc->getUnitState(1, 'UNIT_1');
        $this->assertEquals($result, $resultFromGet);

        $updateState = [
            "some_entry" => 'new_content',
            "new_entry" => 'anything',
        ];

        $expectedAfterUpdate = [
            'SOME_STATE' => 'WHATEVER',
            'some_entry' => 'new_content',
            'with_encoded_json_content' => '{"a":"b"}',
            "new_entry" => 'anything',
        ];

        $resultAfterUpdate = $this->dbc->updateUnitState(1, 'UNIT_1', $updateState);
        $this->assertEquals($expectedAfterUpdate, $resultAfterUpdate);

        $resultFromGetAfterUpdate = $this->dbc->getUnitState(1, 'UNIT_1');
        $this->assertEquals($resultAfterUpdate, $resultFromGetAfterUpdate);
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


    function test_getDataParts() {

        $expected = [
            "all" => '{"name":"Elias Example","age":35}',
            "other" => '{"other":"stuff"}'
        ];
        $result = $this->dbc->getDataParts(0, 'UNIT.SAMPLE');
        $this->assertEquals($expected, $result);
    }


    function test_updateDataParts() {
        $this->dbc->updateDataParts(
            0,
            'UNIT.SAMPLE',
            [
                "other" =>  '{"other": "overwritten"}',
                "added" => '{"stuff": "added"}'
            ],
            'the-response-type',
            123456789123
        );
        $expected = [
            "all" => '{"name":"Elias Example","age":35}',
            "other" =>  '{"other": "overwritten"}',
            "added" => '{"stuff": "added"}'
        ];
        $result = $this->dbc->getDataParts(0, 'UNIT.SAMPLE');
        $this->assertEquals($expected, $result);
    }
}
