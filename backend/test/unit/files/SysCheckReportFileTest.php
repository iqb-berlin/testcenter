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
    $sysCheckReportFile = new SysCheckReportFile(
      'SAMPLE_SYSCHECK-REPORT.JSON',
      file_get_contents(DATA_DIR . '/ws_1/SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON'),
      TestEnvironment::staticDate
    );
    $report = $sysCheckReportFile->getReport();
    static::assertEquals('2020-02-17 13:01:31', $report['date']);
    static::assertEquals('SYSCHECK.SAMPLE', $report['checkId']);
    static::assertEquals('Linux', $report['environment'][0]['value']);
    static::assertEquals('date', $report['fileData'][0]['id']);
    static::assertEquals(1627545600, $report['fileData'][0]['value']);
    static::assertEquals('datestr', $report['fileData'][1]['id']);
    static::assertEquals('2021-07-29 10:00:00', $report['fileData'][1]['value']);
  }
}
