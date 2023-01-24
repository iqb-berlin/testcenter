<?php
declare(strict_types=1);
use org\bovigo\vfs\vfsStream;
use org\bovigo\vfs\vfsStreamContent;
use org\bovigo\vfs\vfsStreamWrapper;

// TODO unit-tests galore

class TestEnvironment {

    const staticDate = 1627545600;

    static function setUpEnvironmentForRealDataE2ETests(): void {

        try {

            define('DATA_DIR', ROOT_DIR . '/data');

            /* @var DBConfig $dbConfig */
            $dbConfig = DBConfig::fromFile(ROOT_DIR . '/backend/config/DBConnectionData.json');
            $dbConfig->staticTokens = true;
            DB::connect($dbConfig);

            TimeStamp::setup(null, '@' . TestEnvironment::staticDate);
            BroadcastService::setup('', '');
            XMLSchema::setup(false);
            FileTime::setup(TestEnvironment::staticDate);
            TestEnvironment::makeRandomStatic();

            TestEnvironment::resetState();
            TestEnvironment::setUpTestData();

        } catch (Throwable $exception) {

            TestEnvironment::bailOut($exception);
        }
    }


    static function setUpEnvironmentForE2eTests(): void {

        try {

            TestEnvironment::setUpVirtualFilesystem();

            DB::connect(new DBConfig([
                'type' => 'temp',
                'staticTokens' => true,
                'insecurePasswords' => true
            ]));

            TimeStamp::setup(null, '@' . TestEnvironment::staticDate);
            BroadcastService::setup('', '');
            XMLSchema::setup(false);
            TestEnvironment::makeRandomStatic();

            $initDAO = new InitDAO();
            $initDAO->runFile(ROOT_DIR . '/backend/test/database.sql');

            TestEnvironment::setUpTestData();
            TestEnvironment::overwriteModificationDatesVfs();
            TestEnvironment::debugVirtualEnvironment();

        } catch (Throwable $exception) {

            TestEnvironment::bailOut($exception);
        }
    }


    private static function makeRandomStatic(): void {

        srand(1);
    }


    private static function resetState(): void {

        Folder::deleteContentsRecursive(DATA_DIR);

        $initDAO = new InitDAO();

        $initDAO->clearDb();

        $initDAO->runFile(ROOT_DIR . "/scripts/database/mysql.sql");
        $initDAO->installPatches(ROOT_DIR . "/scripts/database/mysql.patches.d", true);

        $dbStatus = $initDAO->getDbStatus();
        if ($dbStatus['missing']) {
            throw new Exception("Database reset failed: {$dbStatus['message']}");
        }
    }


    private static function setUpVirtualFilesystem(): void {

        $vfs = vfsStream::setup('root', 0777);
        vfsStream::newDirectory('data', 0777)->at($vfs);
        vfsStream::newDirectory('data/ws_1', 0777)->at($vfs);

        define('DATA_DIR', vfsStream::url('root/data'));
    }


    private static function setUpTestData(): void {

        $initDAO = new InitDAO();

        $workspaceId = $initDAO->createWorkspace('sample_workspace');
        $workspace = new Workspace($workspaceId);
        $adminId = $initDAO->createAdmin('super', 'user123');
        $initDAO->addWorkspaceToAdmin($adminId, $workspaceId);

        $initializer = new WorkspaceInitializer();
        $initializer->cleanWorkspace($workspaceId);
        $initializer->importSampleFiles($workspaceId);
        $workspace->storeAllFilesMeta();

        $initDAO->createSampleLoginsReviewsLogs();
        $initDAO->createSampleExpiredSessions();
        $initDAO->createSampleWorkspaceAdmins();
        $initDAO->createSampleMetaData();
        $personSessions = $initDAO->createSampleMonitorSessions();
        $groupMonitor = $personSessions['test-group-monitor']; /* @var $groupMonitor PersonSession */
        $initDAO->createSampleCommands($groupMonitor->getPerson()->getId());

        $fileName = 'sample_scanned_image.png';
        $initializer->createSampleScanImage($fileName, $workspaceId);
        $initDAO->importScanImage($workspaceId, $fileName);
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


    public static function debugVirtualEnvironment(): void {

        $fullState = "# DATA_DIR\n\n";
        $fullState .= print_r(Folder::getContentsRecursive(DATA_DIR), true);

        $fullState .= "\n\n# Database\n";
        $initDAO = new InitDAO();
        foreach ($initDAO->getDBContentDump() as $table => $content) {

            $fullState .= "## $table\n$content\n";
        }
        $tmpDir = ROOT_DIR . '/tmp';
        if (!$tmpDir) {

            mkdir($tmpDir);
        }
        file_put_contents($tmpDir . '/virtual_environment_dump.md', $fullState);
    }


    private static function bailOut(Throwable $exception): void {

        TestEnvironment::debugVirtualEnvironment();
        $errorUniqueId = ErrorHandler::logException($exception, true);
        http_response_code(500);
        header("Error-ID:$errorUniqueId");
        echo "Could not create environment: " . $exception->getMessage();
        exit(1);
    }
}
