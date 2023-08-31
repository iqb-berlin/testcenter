<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

use Mockery\MockInterface;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class SysChecksFolderTest extends TestCase {
  private SysChecksFolder $folder;

  public static function setUpBeforeClass(): void {
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
  }

  function setUp(): void {
    $workspaceDaoMock = Mockery::mock('overload:' . WorkspaceDAO::class);
    $workspaceDaoMock->allows([
      'getGlobalIds' => VfsForTest::globalIds
    ]);
    VfsForTest::setUp();
    $this->folder = new SysChecksFolder(1);
  }

  function test_findAvailableSysChecks() {
    $result = $this->folder->findAvailableSysChecks();
    $this->assertCount(1, $result);
    $this->assertEquals('SYSCHECK.SAMPLE', $result[0]->getId());
  }
}
