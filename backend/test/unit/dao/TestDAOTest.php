<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class TestDAOTest extends TestCase {
  private TestDAO $dbc;

  function setUp(): void {
    require_once "test/unit/TestDB.class.php";

    TestDB::setUp();
    $this->dbc = new TestDAO();
    $this->dbc->runFile(ROOT_DIR . '/backend/test/unit/testdata.sql');
  }

  function tearDown(): void {
    unset($this->dbc);
  }

  function test_getTestState() {
    $expected = ['CURRENT_UNIT_ID' => 'UNIT_1'];
    $result = $this->dbc->getTestState(1);

    $this->assertEquals($expected, $result);

    $expected = [];
    $result = $this->dbc->getTestState(3);

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
    $testStatePatch = [
      [
        'key' => "some_entry",
        'content' => 'some_content',
        'timeStamp' => 1
      ],
      [
        'key' => "with_encoded_json_content",
        'content' => '{"a":"b"}',
        'timeStamp' => 2
      ]
    ];

    $expected = [
      'CURRENT_UNIT_ID' => 'UNIT_1',
      'some_entry' => 'some_content',
      'with_encoded_json_content' => '{"a":"b"}'
    ];

    $result = $this->dbc->updateTestState(1, $testStatePatch);
    $this->assertEquals($expected, $result);

    $resultFromGet = $this->dbc->getTestState(1);
    $this->assertEquals($result, $resultFromGet);

    $updateState = [
      [
        'key' => "some_entry",
        'content' => 'new_content',
        'timeStamp' => 3
      ],
      [
        'key' => "new_entry",
        'content' => 'anything',
        'timeStamp' => 4
      ]
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
      [
        'key' => "some_entry",
        'content' => 'some_content',
        'timeStamp' => 1
      ],
      [
        'key' => "with_encoded_json_content",
        'content' => '{"a":"b"}',
        'timeStamp' => 2
      ]
    ];

    $expected = [
      'SOME_STATE' => 'WHATEVER',
      'some_entry' => 'some_content',
      'with_encoded_json_content' => '{"a":"b"}'
    ];

    $result = $this->dbc->updateUnitState(1, 'UNIT_1', $testState, 'UNIT_1');
    $this->assertEquals($expected, $result);

    $resultFromGet = $this->dbc->getUnitState(1, 'UNIT_1');
    $this->assertEquals($result, $resultFromGet);

    $updateState = [
      [
        'key' => "some_entry",
        'content' => 'new_content',
        'timeStamp' => 3
      ],
      [
        'key' => "new_entry",
        'content' => 'anything',
        'timeStamp' => 4
      ]
    ];

    $expectedAfterUpdate = [
      'SOME_STATE' => 'WHATEVER',
      'some_entry' => 'new_content',
      'with_encoded_json_content' => '{"a":"b"}',
      "new_entry" => 'anything',
    ];

    $resultAfterUpdate = $this->dbc->updateUnitState(1, 'UNIT_1', $updateState, 'UNIT_1');
    $this->assertEquals($expectedAfterUpdate, $resultAfterUpdate);

    $resultFromGetAfterUpdate = $this->dbc->getUnitState(1, 'UNIT_1');
    $this->assertEquals($resultAfterUpdate, $resultFromGetAfterUpdate);
  }

  function test_updateUnitState_confusedOrder() {
    $updateState = [
      [
        'key' => "my_entry",
        'content' => 'initial',
        'timeStamp' => 3
      ]
    ];
    $expectedAfterUpdate = [
      'my_entry' => 'initial',
      'SOME_STATE' => 'WHATEVER'
    ];
    $resultAfterUpdate = $this->dbc->updateUnitState(1, 'UNIT_1', $updateState, 'UNIT_1');
    $this->assertEquals($expectedAfterUpdate, $resultAfterUpdate);

    $updateState = [
      [
        'key' => "my_entry",
        'content' => 'ignored, because it\'s older than last update',
        'timeStamp' => 2
      ]
    ];
    $resultAfterUpdate = $this->dbc->updateUnitState(1, 'UNIT_1', $updateState, 'UNIT_1');
    $this->assertEquals($expectedAfterUpdate, $resultAfterUpdate);


    $updateState = [
      [
        'key' => "my_entry",
        'content' => 'applied',
        'timeStamp' => 4
      ]
    ];
    $expectedAfterUpdate = [
      'my_entry' => 'applied',
      'SOME_STATE' => 'WHATEVER'
    ];
    $resultAfterUpdate = $this->dbc->updateUnitState(1, 'UNIT_1', $updateState, 'UNIT_1');
    $this->assertEquals($expectedAfterUpdate, $resultAfterUpdate);
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
      "dataParts" => [
        "all" => '{"name":"Elias Example","age":35}',
        "other" => '{"other":"stuff"}'
      ],
      "dataType" => 'the-response-type'
    ];
    $result = $this->dbc->getDataParts(1, 'UNIT.SAMPLE');
    $this->assertEquals($expected, $result);
  }

  function test_updateDataParts() {
    $this->dbc->updateDataParts(
      1,
      'UNIT.SAMPLE',
      [
        "other" => '{"other": "overwritten"}',
        "added" => '{"stuff": "added"}'
      ],
      'the-response-type',
      123456789123
    );
    $expected = [
      "dataParts" => [
        "all" => '{"name":"Elias Example","age":35}',
        "other" => '{"other": "overwritten"}',
        "added" => '{"stuff": "added"}'
      ],
      "dataType" => 'the-response-type'
    ];
    $result = $this->dbc->getDataParts(1, 'UNIT.SAMPLE');
    $this->assertEquals($expected, $result);
  }
}
