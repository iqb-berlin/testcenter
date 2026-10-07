<?php

declare(strict_types=1);

use JetBrains\PhpStorm\NoReturn;

class TestEnvironment {
  const int staticDate = 1627545600;
  const array testModes = ['prepare', 'api', 'integration', 'prepare-integration'];
  // separate directories, so resetting one suite's files never touches the other's
  const string integrationTestDataDir = 'data-TEST';
  const string apiTestDataDir = 'data-TEST-api';
  static string | null $testMode = null;


  public static function setup(string $testMode, ?string $testClock = null): void {
    self::$testMode = in_array($testMode, self::testModes) ? $testMode : 'api';
    $testClock = $testClock ?? self::staticDate;

    try {
      SystemConfig::$debug_useStaticTime = '@' . (int) $testClock;
      SystemConfig::$debug_useStaticTokens = true;
      SystemConfig::$debug_useInsecurePasswords = true;
      SystemConfig::$debug_fastLoginReuse = true;
      self::makeRandomStatic();
      DB::connectToTestDB();

      if (self::$testMode == 'integration') {
        // this is called every single call from integration tests
        self::defineTestDataDir(self::integrationTestDataDir, false);
      }

      if (self::$testMode == 'prepare-integration') {
        // this is called one time before each integration test (cypress)
        self::defineTestDataDir(self::integrationTestDataDir, true);
        self::createTestFiles(true);
        self::overwriteModificationDatesTestDataDir();
        self::buildTestDB();
        self::createTestData();
      }

      if (self::$testMode == 'prepare') {
        // this is called once before the api tests (dredd)
        self::defineTestDataDir(self::apiTestDataDir, true);
        self::createTestFiles(false);
        self::overwriteModificationDatesTestDataDir();
        self::buildTestDB();
        self::createTestData();
      }

      if (self::$testMode == 'api') {
        // overwrite the settings of .env file, to make the api tests deterministic and independent of real .env configs
        SystemConfig::$bruteForceProtection_sessions = [];
        SystemConfig::$server_key = 'Secret';

        // every api call starts from the same files; a real directory (not vfs), so path
        // resolution like realpath behaves as in production
        self::defineTestDataDir(self::apiTestDataDir, true);
        self::createTestFiles(false);
        self::overwriteModificationDatesTestDataDir();
        // in api-tests every call is atomic and the test db gets restored afterwards
        // the test db must be set up before with $testMode == 'prepare'
        $initDAO = new InitDAO();
        $initDAO->beginTransaction();
        register_shutdown_function([self::class, "rollback"]);
      }
    } catch (Throwable $exception) {
      TestEnvironment::bailOut($exception);
    }
  }

  public static function makeRandomStatic(): void {
    srand(1);
  }

  private static function createTestFiles(bool $includeSystemTestFiles): void {
    $initializer = new WorkspaceInitializer();
    $initializer->importSampleFiles(1, 'default');
    Folder::createPath(DATA_DIR . "/ws_1/UnitAttachments");
    $initializer->createSampleScanImage("UnitAttachments/h5ki-bd-va4dg-jc2to2mp_6tga4teiw.png", 1);
    if ($includeSystemTestFiles) {
      $initializer->importSampleFiles(1, 'system-test');
      $initializer->importSampleFiles(2, 'default');
    }
  }

  private static function createTestData(): void {
    $initDAO = new InitDAO();

    $initDAO->createWorkspace('sample_workspace');
    $initDAO->createWorkspace('second_workspace');

    $adminId = $initDAO->createAdmin('super', 'user123');
    $initDAO->addWorkspacesToAdmin($adminId, [1, 2]);

    (new Workspace(1))->storeAllFiles();
    (new Workspace(2))->storeAllFiles();

    $initDAO->createSampleLoginsReviewsLogs();
    $initDAO->createSampleExpiredSessions();
    $initDAO->createSampleWorkspaceAdmins();
    $initDAO->createSampleMetaData();
    $personSessions = $initDAO->createSampleMonitorSessions();
    $groupMonitor = $personSessions['test-group-monitor'];
    /* @var $groupMonitor PersonSession */
    $initDAO->createSampleCommands($groupMonitor->getPerson()->getId());

    $initializer = new WorkspaceInitializer();
    $initializer->createSampleScanImage('sample_scanned_image.png', 1);
    $initDAO->importScanImage(1, 'sample_scanned_image.png');
  }

  // full.sql is the complete, hand-maintained schema, so the test DB is just a plain re-run of it.
  // It used to be a generated cache of base.sql + all patches, which had to be rebuilt when it went stale.
  static function buildTestDB(): void {
    $initDAO = new InitDAO();
    $initDAO->clearDB();
    $initDAO->runFile(ROOT_DIR . '/scripts/database/full.sql');
  }

  private static function rollback(): void {
    $initDAO = new InitDAO();
    $initDAO->rollBack();
  }

  #[NoReturn]
  private static function bailOut(Throwable $exception): void {
    // TestEnvironment::debugVirtualEnvironment();
    $errorUniqueId = ErrorHandler::logException($exception, true);
    http_response_code(500);
    header("Error-ID:$errorUniqueId");
    throw new RuntimeException("Could not create environment: " . $exception->getMessage());
  }

  private static function defineTestDataDir(string $dirName, bool $shouldReset): void {
    define('DATA_DIR', ROOT_DIR . '/' . $dirName);
    if (!$shouldReset) {
      return;
    }
    Folder::createPath(DATA_DIR);
    Folder::deleteContentsRecursive(DATA_DIR);
  }

  private static function overwriteModificationDatesTestDataDir(?string $dir = DATA_DIR): void {
    foreach (new DirectoryIterator($dir) as $child) {
      if ($child->isDot() or $child->isLink()) {
        continue;
      }
      touch($child->getPathname(), TestEnvironment::staticDate);
      if ($child->isDir()) {
        self::overwriteModificationDatesTestDataDir($child->getPathname());
      }
    }
  }
}
