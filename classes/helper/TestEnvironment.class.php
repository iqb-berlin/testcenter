<?php
declare(strict_types=1);
use org\bovigo\vfs\vfsStream;
use org\bovigo\vfs\vfsStreamContent;
use org\bovigo\vfs\vfsStreamWrapper;

// TODO unit-tests galore

class TestEnvironment {

    const staticDate = 1627545600;

    static function setUpEnvironmentForRealDataE2ETests() {

        try {

            define('DATA_DIR', ROOT_DIR . '/vo_data'); // TODO make configurable

            $e2eConfig = JSON::decode(file_get_contents(ROOT_DIR . "/config/e2eTests.json"));

            /* @var DBConfig $dbConfig */
            $dbConfig = DBConfig::fromFile(ROOT_DIR . "/config/DBConnectionData.{$e2eConfig->configFile}.json");
            $dbConfig->staticTokens = true;
            DB::connect($dbConfig);

            TimeStamp::setup(null, '@' . TestEnvironment::staticDate);
            BroadcastService::setup('', '');
            XMLSchema::setup(false);
            FileTime::setup(TestEnvironment::staticDate);

            TestEnvironment::resetState();
            TestEnvironment::setUpTestData();
            TestEnvironment::makeRandomStatic();

        } catch (Throwable $exception) {

            TestEnvironment::bailOut($exception);
        }
    }


    static function setUpEnvironmentForE2eTests() {

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

            $initDAO = new InitDAO();
            $initDAO->runFile('scripts/sql-schema/sqlite.sql');

            TestEnvironment::setUpTestData();
            TestEnvironment::overwriteModificationDatesVfs();
            TestEnvironment::debugVirtualEnvironment();

            TestEnvironment::makeRandomStatic();

        } catch (Throwable $exception) {

            TestEnvironment::bailOut($exception);
        }
    }


    private static function makeRandomStatic() {

        srand(1);
    }


    private static function resetState() {

        Folder::deleteContentsRecursive(DATA_DIR);

        $initDAO = new InitDAO();

        $initDAO->clearDb();

        $initDAO->runFile(ROOT_DIR . "/scripts/sql-schema/mysql.sql");
        $initDAO->installPatches(ROOT_DIR . "/scripts/sql-schema/mysql.patches.d", true);

        $dbStatus = $initDAO->getDbStatus();
        if ($dbStatus['missing']) {
            throw new Exception("Database reset failed: {$dbStatus['message']}");
        }
    }


    private static function setUpVirtualFilesystem(): void {

        $vfs = vfsStream::setup('root', 0777);
        vfsStream::newDirectory('vo_data', 0777)->at($vfs);
        vfsStream::newDirectory('vo_data/ws_1', 0777)->at($vfs);

        define('DATA_DIR', vfsStream::url('root/vo_data'));
    }


    private static function setUpTestData(): void {

        $initDAO = new InitDAO();

        $workspaceId = $initDAO->createWorkspace('sample_workspace');
        $adminId = $initDAO->createAdmin('super', 'user123');
        $initDAO->addWorkspaceToAdmin($adminId, $workspaceId);

        $initializer = new WorkspaceInitializer();
        $initializer->cleanWorkspace($workspaceId);
        $initializer->importSampleData($workspaceId);

        $initDAO->createSampleLoginsReviewsLogs();
        $initDAO->createSampleExpiredSessions();
        $initDAO->createSampleMetaData();
        $personSessions = $initDAO->createSampleMonitorSessions();
        $groupMonitor = $personSessions['test-group-monitor']; /* @var $groupMonitor PersonSession */
        $initDAO->createSampleCommands($groupMonitor->getPerson()->getId());
    }


    public static function overwriteModificationDatesVfs(vfsStreamContent $dir = null): void {

        if (!$dir) {
            $dir = vfsStreamWrapper::getRoot()->getChild('vo_data');
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
        if (!file_exists(ROOT_DIR . '/integration/tmp/')) {

            mkdir(ROOT_DIR . '/integration/tmp/');
        }
        file_put_contents(ROOT_DIR . '/integration/tmp/virtual_environment_dump.md', $fullState);
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
