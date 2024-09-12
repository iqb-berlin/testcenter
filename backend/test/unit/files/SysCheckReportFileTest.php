<?php

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class SysCheckReportFileTest extends TestCase {
  public static function setUpBeforeClass(): void {
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
  }

  function setUp(): void {
    VfsForTest::setUp();
  }

  function test_construct(): void {
    $sysCheckReportFile = new SysCheckReportFile(DATA_DIR . '/ws_1/SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON');
    $report = $sysCheckReportFile->getReport();
    $this->assertEquals('2020-02-17 13:01:31', $report['date']);
    $this->assertEquals('SYSCHECK.SAMPLE', $report['checkId']);
    $this->assertEquals('Linux', $report['environment'][0]['value']);
    $this->assertEquals('date', $report['fileData'][0]['id']);
    $this->assertEquals(1627545600, $report['fileData'][0]['value']);
    $this->assertEquals('datestr', $report['fileData'][1]['id']);
    $this->assertEquals('2021-07-29 10:00:00', $report['fileData'][1]['value']);
  }
}
