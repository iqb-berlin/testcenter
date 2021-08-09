<?php
declare(strict_types=1);
use org\bovigo\vfs\vfsStream;
use org\bovigo\vfs\vfsStreamContent;
use org\bovigo\vfs\vfsStreamDirectory;

// TODO unit-tests galore

class TestEnvironment {

    const staticFileModificationDate = 1627545600;

    static function setUpEnvironmentForRealDataE2ETests() {

        try {

            define('DATA_DIR', ROOT_DIR . '/vo_data'); // TODO make configurable

            $e2eConfig = JSON::decode(file_get_contents(ROOT_DIR . "/config/e2eTests.json"));

            /* @var DBConfig $dbConfig */
            $dbConfig = DBConfig::fromFile(ROOT_DIR . "/config/DBConnectionData.{$e2eConfig->configFile}.json");
            $dbConfig->staticTokens = true;
            DB::connect($dbConfig);

            BroadcastService::setup('', '');
            XMLSchema::setup(false);

            TestEnvironment::resetState();
            TestEnvironment::setUpTestData();

            TestEnvironment::makeRandomStatic();

        } catch (Throwable $exception) {

            TestEnvironment::bailOut($exception);
        }
    }


    static function setUpEnvironmentForE2eTests() {

        try {

            $voData = TestEnvironment::setUpVirtualFilesystem();

            DB::connect(new DBConfig([
                'type' => 'temp',
                'staticTokens' => true,
                'insecurePasswords' => true
            ]));

            BroadcastService::setup('', '');
            XMLSchema::setup(false);

            $initDAO = new InitDAO();
            $initDAO->runFile('scripts/sql-schema/sqlite.sql');

            TestEnvironment::setUpTestData();
            TestEnvironment::overwriteModificationDates($voData);
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

        $typeName = ($initDAO->getDBType() == "mysql") ? 'mysql' : 'postgresql';

        $initDAO->runFile(ROOT_DIR . "/scripts/sql-schema/$typeName.sql");
        $initDAO->runFile(ROOT_DIR . "/scripts/sql-schema/patches.$typeName.sql");

        $dbStatus = $initDAO->getDbStatus();
        if ($dbStatus['missing'] or $dbStatus['used']) {
            throw new Exception("Database reset failed: {$dbStatus['message']}");
        }
    }


    private static function setUpVirtualFilesystem(): vfsStreamDirectory {

        $vfs = vfsStream::setup('root', 0777);
        $voData = vfsStream::newDirectory('vo_data', 0777)->at($vfs);
        vfsStream::newDirectory('vo_data/ws_1', 0777)->at($vfs);

        define('DATA_DIR', vfsStream::url('root/vo_data'));
        return $voData;
    }


    private static function setUpTestData() {

        $initDAO = new InitDAO();

        $workspaceId = $initDAO->createWorkspace('sample_workspace');
        $adminId = $initDAO->createAdmin('super', 'user123');
        $initDAO->addWorkspaceToAdmin($adminId, $workspaceId);

        $initializer = new WorkspaceInitializer();
        $initializer->cleanWorkspace($workspaceId);
        $initializer->importSampleData($workspaceId);

        $initDAO->createSampleLoginsReviewsLogs('xxx');
        $initDAO->createSampleExpiredSessions('xxx');
        $initDAO->createSampleMetaData();
        $persons = $initDAO->createSampleMonitorSessions();
        $groupMonitor = $persons['test-group-monitor']; /* @var $groupMonitor Person */
        $initDAO->createSampleCommands($groupMonitor->getId());
    }


    public static function overwriteModificationDates(vfsStreamContent $dir) {

        file_put_contents(DATA_DIR . '/TEST', "##");
        mkdir(DATA_DIR . '/TESTDIR');
        rename(DATA_DIR . '/ws_1', DATA_DIR . '/ws_X');
        clearstatcache();
        error_log("+++ {$dir->url()} +++ " . DATA_DIR);
        $dir->lastModified(TestEnvironment::staticFileModificationDate);
        foreach ($dir->getChildren() as $child) {
            $child->lastModified(TestEnvironment::staticFileModificationDate);
            error_log("### {$child->url()} +++");
            if (is_dir($child->url())) {
                TestEnvironment::overwriteModificationDates($child);
            }
        }
    }


    public static function debugVirtualEnvironment() {

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


    private static function bailOut(Throwable $exception) {

        TestEnvironment::debugVirtualEnvironment();
        $errorUniqueId = ErrorHandler::logException($exception, true);
        http_response_code(500);
        header("Error-ID:$errorUniqueId");
        echo "Could not create environment: " . $exception->getMessage();
        exit(1);
    }
}
