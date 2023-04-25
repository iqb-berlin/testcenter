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
    require_once "src/data-collection/DataCollectionTypeSafe.class.php";
    require_once "src/workspace/Workspace.class.php";
    require_once "src/workspace/SysChecksFolder.class.php";
    require_once "src/helper/FileTime.class.php";
    require_once "src/helper/Version.class.php";
    require_once "src/helper/XMLSchema.class.php";
    require_once "src/helper/JSON.class.php";
    require_once "test/unit/mock-classes/ExternalFileMock.php";
    require_once "src/data-collection/FileData.class.php";
    require_once "src/files/File.class.php";
    require_once "src/files/XMLFile.class.php";
    require_once "src/files/XMLFileSysCheck.class.php";

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
