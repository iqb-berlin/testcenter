<?php
declare(strict_types=1);

use JetBrains\PhpStorm\NoReturn;
use org\bovigo\vfs\vfsStream;
use org\bovigo\vfs\vfsStreamContent;
use org\bovigo\vfs\vfsStreamWrapper;

class TestEnvironment {
    const staticDate = 1627545600;

    public static function setup(string $testMode): void {

        $testMode = in_array($testMode, ['prepare', 'api', 'integration']) ? $testMode : 'api';
        $resetBeforeCall = $testMode == 'prepare';
        $resetAfterCall = $testMode == 'api';

        try {

            // TODO restore last state of test-data-dir when $testMode == 'integration'
            self::setUpVirtualFilesystem();

            TimeStamp::setup(null, '@' . self::staticDate);
            BroadcastService::setup('', '');
            XMLSchema::setup(false);
            self::makeRandomStatic();

            self::createTestFiles();
            self::overwriteModificationDatesVfs();

            $config = DBConfig::fromFile(ROOT_DIR . '/backend/config/DBConnectionData.json');
            /* @var $config DBConfig */
            $prodDBName = $config->dbname;
            $config->dbname = 'TMP_' . $config->dbname;
            $config->staticTokens = true;
            $config->insecurePasswords = true;
            DB::connect($config);

            $initDAO = new InitDAO();

            if ($resetBeforeCall) {
                $initDAO->clearDB();
                $initDAO->cloneDB($prodDBName);
                self::createTestData();
            }

            if ($resetAfterCall) {
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


    private static function setUpVirtualFilesystem(): void {

        $vfs = vfsStream::setup('root', 0777);
        vfsStream::newDirectory('data', 0777)->at($vfs);
        vfsStream::newDirectory('data/ws_1', 0777)->at($vfs);

        define('DATA_DIR', vfsStream::url('root/data'));
    }


    private static function createTestFiles(): void {

        $initializer = new WorkspaceInitializer();
        $initializer->importSampleFiles(1);
        Folder::createPath(DATA_DIR . "/ws_1/UnitAttachments");
        $initializer->createSampleScanImage("UnitAttachments/lrOI-JLFOAPBOHt8GZyT_lRTL8qcdNy.png", 1);
    }

    private static function createTestData(): void {

        $initDAO = new InitDAO();

        $initDAO->createWorkspace('sample_workspace');

        $adminId = $initDAO->createAdmin('super', 'user123');
        $initDAO->addWorkspacesToAdmin($adminId, [1]);

        $workspace = new Workspace(1);
        $workspace->storeAllFiles();

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


    public static function overwriteModificationDatesVfs(vfsStreamContent $dir = null): void {

        if (!$dir) {
            $dir = vfsStreamWrapper::getRoot()->getChild('data');
        }
        $dir->lastModified(TestEnvironment::staticDate);
        foreach ($dir->getChildren() as $child) {
            $child->lastModified(TestEnvironment::staticDate);
            if (is_dir($child->url())) {
                TestEnvironment::overwriteModificationDatesVfs($child);
            }
        }
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
        echo "Could not create environment: " . $exception->getMessage();
        exit(1);
    }
}
