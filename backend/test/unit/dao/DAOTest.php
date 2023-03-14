<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class DAOTest extends TestCase {
  private DAO $dbc;

  function setUp(): void {
    require_once "src/exception/HttpError.class.php";
    require_once "src/data-collection/DataCollection.class.php";
    require_once "src/helper/DB.class.php";
    require_once "src/helper/JSON.class.php";
    require_once "src/data-collection/DBConfig.class.php";
    require_once "src/dao/DAO.class.php";
    require_once "test/unit/TestDB.class.php";

    TestDB::setUp();
    $this->dbc = new DAO();
    $this->dbc->runFile(REAL_ROOT_DIR . '/backend/test/unit/testdata.sql');
  }

  function tearDown(): void {
    unset($this->dbc);
  }

  function test_getDBSchemaVersion() {
    $result = $this->dbc->getDBSchemaVersion();
    $this->assertEquals('0.0.0-no-entry', $result, 'No entry in meta table');

    $this->dbc->_("insert into meta (metaKey, value) values ('dbSchemaVersion', '10.0.0')");
    $result = $this->dbc->getDBSchemaVersion();
    $this->assertEquals('10.0.0', $result, 'Version present');

    $this->dbc->_("drop table meta");
    $result = $this->dbc->getDBSchemaVersion();
    $this->assertEquals('0.0.0-no-table', $result, 'No meta table present');
  }

  public function test_getMeta() {
    $result = $this->dbc->getMeta(['cat1']);
    $expectation = [
      'cat1' => [
        'keyA' => 'valueA',
        'keyB' => 'valueB'
      ]
    ];
    $this->assertEquals($expectation, $result);

    $result = $this->dbc->getMeta(['cat1', 'cat2']);
    $expectation = [
      'cat1' => [
        'keyA' => 'valueA',
        'keyB' => 'valueB'
      ],
      'cat2' => [
        'keyA' => 'valueA',
        'keyB' => 'valueB'
      ]
    ];
    $this->assertEquals($expectation, $result);
  }

  public function test_setMeta() {
    $this->dbc->setMeta('new', 'aKey', 'aValue');
    $result = $this->dbc->getMeta(['new']);
    $expectation = [
      'new' => [
        'aKey' => 'aValue',
      ]
    ];
    $this->assertEquals($expectation, $result);

    $this->dbc->setMeta('new', 'aKey', 'newValue');
    $result = $this->dbc->getMeta(['new']);
    $expectation = [
      'new' => [
        'aKey' => 'newValue',
      ]
    ];
    $this->assertEquals($expectation, $result);
  }

  public function test_getTestFullState() {
    $result = $this->dbc->getTestFullState(['testState' => '{"A":"B"}', "locked" => true, "running" => true]);
    $this->assertSame(["A" => "B", "status" => 'locked'], $result);

    $result = $this->dbc->getTestFullState(['testState' => '{"A":"B"}', "locked" => false, "running" => false]);
    $this->assertSame(["A" => "B", "status" => 'pending'], $result);

    $result = $this->dbc->getTestFullState(['testState' => '{"A":"B"}', "locked" => false, "running" => true]);
    $this->assertSame(["A" => "B", "status" => 'running'], $result);

    $result = $this->dbc->getTestFullState(['testState' => '{"A":"B"}', "locked" => true, "running" => false]);
    $this->assertSame(["A" => "B", "status" => 'locked'], $result);
  }
}
