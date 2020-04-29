<?php
declare(strict_types=1);

use org\bovigo\vfs\vfsStream;

// TODO unit-tests galore

class TestEnvironment {


    static function setUpEnvironmentForRealDataE2ETests() {

        try {

            define('DATA_DIR', ROOT_DIR . '/vo_data'); // TODO make configurable

            $e2eConfig = JSON::decode(file_get_contents(ROOT_DIR . "/config/e2eTests.json"));

            /* @var DBConfig $dbConfig */
            $dbConfig = DBConfig::fromFile(ROOT_DIR . "/config/DBConnectionData.{$e2eConfig->configFile}.json");
            $dbConfig->staticTokens = true;
            DB::connect($dbConfig);

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
                'staticTokens' => true
            ]));

            $initDAO = new InitDAO();
            $initDAO->runFile('scripts/sql-schema/sqlite.sql');
            TestEnvironment::setUpTestData();

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

        if ($notReadyMsg = $initDAO->isDbNotReady()) {
            throw new Exception("Database reset failed: $notReadyMsg");
        }
    }


    private static function setUpVirtualFilesystem() {

        $vfs = vfsStream::setup('root', 0777);
        vfsStream::newDirectory('vo_data', 0777)->at($vfs);

        define('DATA_DIR', vfsStream::url('root/vo_data'));
    }


    private static function setUpTestData() {

        $initArgs = new InstallationArguments([
            'user_name' => 'super',
            'user_password' => 'user123',
            'workspace' => 'sample_workspace',
            'test_login_name' => 'test',
            'test_login_password' => 'user123',
            'test_person_codes' => 'xxx yyy'
        ]);

        $initDAO = new InitDAO();

        $newIds = $initDAO->createWorkspaceAndAdmin(
            $initArgs->user_name,
            $initArgs->user_password,
            $initArgs->workspace
        );

        $initializer = new WorkspaceInitializer();
        $initializer->cleanWorkspace($newIds['workspaceId']);
        $initializer->importSampleData($newIds['workspaceId'], $initArgs);

        $initDAO->createSampleLoginsReviewsLogs('xxx');
        $initDAO->createSampleExpiredSessions('xxx');
        $initDAO->createSampleMonitorSession();
        TestEnvironment::debugVirtualEnvironment();
    }


    private static function debugVirtualEnvironment() {

        $initDAO = new InitDAO();
        $fullState = "# State of DATA_DIR\n\n";
        $fullState .= print_r(Folder::getContentsRecursive(DATA_DIR), true);
        $fullState .= "\n\n# State of DB\n";
        $fullState .= $initDAO->getDBContentDump();
        file_put_contents(ROOT_DIR . '/integration/tmp/lastVEState.md', $fullState);
    }


    private static function bailOut(Throwable $exception) {

        $errorUniqueId = ErrorHandler::logException($exception, true);
        http_response_code(500);
        header("Error-ID:$errorUniqueId");
        echo "Could not create virtual environment: " . $exception->getMessage();
        exit(1);
    }
}
