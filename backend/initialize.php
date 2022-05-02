#!/usr/bin/php
<?php
/**
 * A CLI script to initialize the application
 *  It does a lot of stuff, it
 * - creates config files if missing.
 * - creates an admin user, if missing.
 * - can create a workspace with sample data..
 * - installs / updates the DB if necessary.
 *
 * If there is no admin, one will be created. You can set up credentials for him:
 * --user_name=(super user name)
 * --user_password=(super user password)
 *
 * If there is no workspace one (containing sample content) will be created
 * --workspace=(workspace name)
 *
 * Admin- and workspace-creation can be skipped by providing an empty string as for workspace respectively user_name
 *
 * You can remove the existing installation completely: (Caution! Your data will be gone!)
 * --overwrite_existing_installation=true
 *
 *  If the DB-Connection-Data-File (/config/DBConnectionData.json) shall be written, provide:
 * --host=(mostly `localhost`)
 * --post=(usually 3306)
 * --dbname=(database name)
 * --user=(mysql-username)
 * --password=(mysql-password)
 * --salt=(an arbitrary string, optional)
 *
 * If the the System-Config-File (/config/system.json) shall be written, provide
 * --broadcastServiceUriPush=(address of broadcast service to push for the backend)
 * --broadcastServiceUriSubscribe=(address of broadcast service to subscribe to from frontend)
 * Add them with empty strings if you don't want to use the broadcast service at all.
 *
 *
 * Note: run this script as a user who can create files which can be read by the webserver or
 * change file rights afterwardsfor example:
 * sudo --user=www-data php scripts/initialize.php --user_name=a --user_password=x123456
 *
 */


if (php_sapi_name() !== 'cli') {

    header('HTTP/1.0 403 Forbidden');
    echo "This is only for usage from command line.";
    exit(1);
}

define('ROOT_DIR', realpath(__DIR__ . '/..'));
define('DATA_DIR', ROOT_DIR . '/data');


require_once(ROOT_DIR . '/backend/autoload.php');

try  {
    $args = CLI::getOpt();
    $installationArguments = new InstallationArguments($args, true);

    $systemVersion = Version::get();
    CLI::h1("IQB TESTCENTER BACKEND $systemVersion");

    CLI::h2("System-Config");
    if (!file_exists(ROOT_DIR . '/backend/config/system.json')) {

        CLI::p("System-Config not file found (`/backend/config/system.json`). Will be created.");

        $sysConf = new SystemConfig($args, true);

        BroadcastService::setup($sysConf->broadcastServiceUriPush, $sysConf->broadcastServiceUriSubscribe);

        CLI::success("Provided arguments OK.");

        if (!file_exists(ROOT_DIR . '/backend/config')) {
            mkdir(ROOT_DIR . '/backend/config');
            file_put_contents(ROOT_DIR . '/backend/config/readme.md', "#backend-config\nthis directory persists config setting for the testcenter-backend");
        }

        if (!file_put_contents(ROOT_DIR . '/backend/config/system.json', json_encode($sysConf))) {

            throw new Exception("Could not write file `/backend/config/system.json`. Check file permissions on `/config/`.");
        }

        CLI::p("System-Config file written.");

    } else {

        $config = SystemConfig::fromFile(ROOT_DIR . '/config/system.json');
        BroadcastService::setup($config->broadcastServiceUriPush, $config->broadcastServiceUriSubscribe);
        CLI::p("Config file present.");
    }

    CLI::h2("Database config");
    if (!file_exists(ROOT_DIR . '/backend/config/DBConnectionData.json')) {

        CLI::p("Database-Config not file found (`/backend/config/DBConnectionData.json`), will be created.");

        $config = new DBConfig($args, true);
        CLI::connectDBWithRetries($config, 5);

        CLI::success("Provided arguments OK.");

        if (!file_put_contents(ROOT_DIR . '/backend/config/DBConnectionData.json', json_encode(DB::getConfig()))) {

            throw new Exception("Could not write file. Check file permissions on `/config/`.");
        }

        CLI::p("Database-Config file written.");

    } else {

        CLI::connectDBWithRetries(null, 5);
        $config = DB::getConfig();
        CLI::p("Config file present (and OK).");
    }


    CLI::h2("Database Structure");
    $initDAO = new InitDAO();

    if ($config->type !== "mysql") {

        throw new Exception("Database Type {$config->type} not supported. This script only supports MySQL.");
    }

    $dbStatus = $initDAO->getDbStatus();
    CLI::p("Database status: {$dbStatus['message']}");

    if ($installationArguments->overwrite_existing_installation) {

        CLI::warning("Clear database");
        $tablesDropped = $initDAO->clearDb();
        CLI::p("Tables dropped: " . implode(', ', $tablesDropped));
    }

    if ($installationArguments->overwrite_existing_installation or ($dbStatus['tables'] == 'empty')) {

        CLI::p("Install basic database structure");
        $initDAO->runFile(ROOT_DIR . "/database/mysql.sql");
    }

    $dbSchemaVersion = $initDAO->getDBSchemaVersion();
    $isCurrentVersion = Version::compare($dbSchemaVersion); // 1 : System is older than DB!, -1 : DB is outdated
    CLI::p("Database schema version is $dbSchemaVersion, system version is $systemVersion");
    if ($isCurrentVersion >= 0) {

       echo ": O.K.";

    } else {

        CLI::p("Install patches if necessary");
        $allowFailing = (in_array($dbSchemaVersion, ['0.0.0-no-table', '0.0.0-no-value']));
        $patchInstallReport = $initDAO->installPatches(ROOT_DIR . "/database/mysql.patches.d", $allowFailing);
        foreach ($patchInstallReport['patches'] as $patch) {

          if (isset($patchInstallReport['errors'][$patch])) {

              CLI::warning("* $patch: {$patchInstallReport['errors'][$patch]}");

          } else {

              CLI::success("* $patch: installed successfully.");
          }
        }
        if (count($patchInstallReport['errors']) and !$allowFailing) {

          throw new Exception('Installing database patches failed.');
        }
    }

    $newDbStatus = $initDAO->getDbStatus();
    if (!($newDbStatus['tables'] == 'complete') and !$installationArguments->skip_db_integrity_check) {

        throw new Exception("Database integrity check failed: {$newDbStatus['message']}");
    }
    $initDAO->setDBSchemaVersion($systemVersion);
    CLI::success("DB passed integrity check.");

    CLI::h2("Workspaces");

    if (!file_exists(DATA_DIR)) {
        mkdir(DATA_DIR);
        CLI::success("Data-Directory created: `". DATA_DIR . "`");
    }

    $initializer = new WorkspaceInitializer();

    if ($installationArguments->overwrite_existing_installation) {

        foreach (Workspace::getAll() as /* @var $workspace Workspace */ $workspace) {
            $filesInWorkspace = array_reduce($workspace->countFilesOfAllSubFolders(), function ($carry, $item) {
                return $carry + $item;
            }, 0);

            $initializer->cleanWorkspace($workspace->getId());
            CLI::warning("Workspace-folder `ws_{$workspace->getId()}` was DELETED. It contained {$filesInWorkspace} files.");

            Folder::deleteContentsRecursive($workspace->getWorkspacePath());
        }
    }

    $workspaceIds = [];

    foreach (Workspace::getAll() as /* @var $workspace Workspace */ $workspace) {

        $workspaceData = $initDAO->createWorkspaceIfMissing($workspace);
        $workspaceIds[] = $workspaceData['id'];
        CLI::h3("Workspace `{$workspaceData['name']}`");
        if (isset($workspaceData['restored'])) {
            CLI::warning("Orphaned workspace-folder found `ws_{$workspaceData['id']}` and restored in DB.");
        }

        if (!$installationArguments->skip_read_workspace_files) {

            $stats = $workspace->storeAllFilesMeta();

            CLI::p("Logins updated: -{$stats['logins']['deleted']} / +{$stats['logins']['added']}");

            $statsString = implode(
                ", ",
                array_filter(
                    array_map(
                        function($key, $value) { return $value ? "$key: $value" : null; },
                        array_keys($stats['valid']),
                        array_values($stats['valid']),
                    )
                )
            );
            CLI::p("Files found: " . $statsString);

            if ($stats['invalid']) {
                CLI::warning("Invalid files found: {$stats['invalid']}");
            }
        }
    }

    if (!count($workspaceIds) and $installationArguments->workspace) {

        $sampleWorkspaceId = $initDAO->createWorkspace($installationArguments->workspace);
        $sampleWorkspace = new Workspace($sampleWorkspaceId);

        CLI::success("Sample Workspace `{$installationArguments->workspace}` as `ws_{$sampleWorkspaceId}` created");

        $initializer->importSampleFiles($sampleWorkspaceId);

        if (!$installationArguments->skip_read_workspace_files) {

            $stats = $sampleWorkspace->storeAllFilesMeta();
        }

        CLI::success("Sample content files created.");

        $workspaceIds[] = $sampleWorkspaceId;
    }

    CLI::h2("Sys-Admin");

    if (!$initDAO->adminExists() and $installationArguments->user_name) {

        CLI::warning("No Sys-Admin found.");

        $adminId = $initDAO->createAdmin($installationArguments->user_name, $installationArguments->user_password);
        CLI::success("Sys-Admin created: `$installationArguments->user_name`.");

        foreach ($workspaceIds as $workspaceId) {

            $initDAO->addWorkspaceToAdmin($adminId, $workspaceId);
            CLI::p("Workspace `ws_$workspaceId` added to `$installationArguments->user_name`.");
        }

    } else {

        CLI::p("At least one Sys-Admin found; nothing to do.");
    }


    $bsStatus = BroadcastService::getStatus();
    if ($bsStatus['status'] == 'online') {
        CLI::h2("Flashing Broadcasting-Service");
        BroadcastService::send('system/clean');
    }

    CLI::h1("Ready.");

} catch (Exception $e) {

    CLI::error($e->getMessage());
    echo "\n";
    ErrorHandler::logException($e, true);
    exit(1);
}

echo "\n";
exit(0);
