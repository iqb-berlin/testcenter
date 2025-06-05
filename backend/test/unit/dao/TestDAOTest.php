<?php
/** @noinspection PhpUnhandledExceptionInspection */

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

  function test_addTestLog() {
    $testId = 1;
    $logKey = 'LOG_KEY_TEST';
    $timestamp = 1623456789;
    $logContent = 'This is a log entry test.';

    // Add the log
    $this->dbc->addTestLog($testId, $logKey, $timestamp, $logContent);

    // Verify log addition (use mock DB or predefined assertions)
    $expectedLog = [
      [
        'logentry' => 'sample log entry',
        'timestamp' => 1597903000
      ],
      [
        'logentry' => $logKey . ' : ' . $logContent,
        'timestamp' => $timestamp
      ]
    ];

    $actualLog = $this->dbc->_(
      'select logentry, timestamp from test_logs where booklet_id = :id',
      [':id' => $testId],
      true
    );

    $this->assertNotEmpty($actualLog);
    $this->assertEquals($expectedLog, $actualLog);

    // Add a log without content
    $emptyContent = '';
    $this->dbc->addTestLog($testId, $logKey, $timestamp, $emptyContent);

    $expectedLogEmptyContent = [
      'logentry' => $logKey,
      'timestamp' => $timestamp
    ];

    $actualLogEmptyContent = $this->dbc->_(
      'select logentry, timestamp from test_logs where booklet_id = :id and logentry = :logentry',
      [':id' => $testId, ':logentry' => $logKey]
    );

    $this->assertNotEmpty($actualLogEmptyContent);
    $this->assertEquals($expectedLogEmptyContent, $actualLogEmptyContent);
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
    // Test with multiple data parts to update
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

    // Test with an empty data parts array
    $this->dbc->updateDataParts(
      1,
      'UNIT.SAMPLE',
      [],
      'the-response-type',
      123456789123
    );
    $expectedEmptyUpdate = [
      "dataParts" => [
        "all" => '{"name":"Elias Example","age":35}',
        "other" => '{"other": "overwritten"}',
        "added" => '{"stuff": "added"}'
      ],
      "dataType" => 'the-response-type'
    ];
    $resultEmptyUpdate = $this->dbc->getDataParts(1, 'UNIT.SAMPLE');
    $this->assertEquals($expectedEmptyUpdate, $resultEmptyUpdate);

    // Test overwrite of existing data parts
    $this->dbc->updateDataParts(
      1,
      'UNIT.SAMPLE',
      [
        "other" => '{"other": "new_overwrite"}'
      ],
      'new-response-type',
      987654321987
    );
    $expectedOverwrite = [
      "dataParts" => [
        "all" => '{"name":"Elias Example","age":35}',
        "other" => '{"other": "new_overwrite"}',
        "added" => '{"stuff": "added"}'
      ],
      "dataType" => 'new-response-type'
    ];
    $resultOverwrite = $this->dbc->getDataParts(1, 'UNIT.SAMPLE');
    $this->assertEquals($expectedOverwrite, $resultOverwrite);

    // Test overwrite when multiple parts have same partid
    $this->dbc->updateDataParts(
      1,
      'UNIT.SAMPLE',
      [
        "other" => '{"other": "new_overwrite"}',
        'other' => '{"other": "completely_new"}'
      ],
      'new-response-type',
      987654321987
    );
    $expectedOverwrite = [
      "dataParts" => [
        "all" => '{"name":"Elias Example","age":35}',
        'other' => '{"other": "completely_new"}',
        "added" => '{"stuff": "added"}'
      ],
      "dataType" => 'new-response-type'
    ];
    $resultOverwrite = $this->dbc->getDataParts(1, 'UNIT.SAMPLE');
    $this->assertEquals($expectedOverwrite, $resultOverwrite);
  }

  function test_addUnitLog() {
    $testId = 1;
    $unitName = 'TEST_UNIT';
    $logKey = 'UNIT_LOG_KEY';
    $timestamp = 1623456789;
    $logContent = 'This is a unit log entry test.';

    // Add the log with content
    $this->dbc->addUnitLog($testId, $unitName, $logKey, $timestamp, $logContent);

    // Verify log addition
    $expectedLog = [
        'logentry' => $logKey . ' = ' . $logContent,
        'timestamp' => $timestamp
    ];

    $actualLog = $this->dbc->_(
      'select logentry, timestamp from unit_logs where unit_id = 
            (select id from units where name = :unitName and booklet_id = :testId)',
      [':unitName' => $unitName, ':testId' => $testId]
    );

    $this->assertNotEmpty($actualLog);
    $this->assertEquals($expectedLog, $actualLog);

    // Add a log without content
    $emptyContent = '';
    $this->dbc->addUnitLog($testId, $unitName, $logKey, $timestamp, $emptyContent);

    $expectedLogEmptyContent = [
      'logentry' => $logKey,
      'timestamp' => $timestamp
    ];

    $actualLogEmptyContent = $this->dbc->_(
      'select logentry, timestamp from unit_logs where unit_id = 
            (select id from units where name = :unitName and booklet_id = :testId) and logentry = :logkey',
      [':unitName' => $unitName, ':testId' => $testId, ':logkey' => $logKey]
    );

    $this->assertNotEmpty($actualLogEmptyContent);
    $this->assertEquals($expectedLogEmptyContent, $actualLogEmptyContent);
  }
}
