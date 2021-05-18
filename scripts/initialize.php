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
 * Use these arguments to set up the initial admin:
 * --user_name=(super user name)
 * --user_password=(super user password)
 *
 * If you want to create a workspace with sample content:
 * --workspace=(workspace name)
 *
 * You can remove the exsiting Installation completely: (Caution! Your data will be gone!)
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

define('ROOT_DIR', realpath(dirname(__FILE__) . '/..'));
define('DATA_DIR', ROOT_DIR . '/vo_data');


require_once(ROOT_DIR . '/autoload.php');

try  {

    $args = new InstallationArguments(getopt("", [
        'user_name::',
        'user_password::',
        'workspace::',
        'overwrite_existing_installation:',
        'skip_db_integrity_check:'
    ]));

    $systemVersion = Version::get();
    CLI::h1("IQB TESTCENTER BACKEND $systemVersion");

    CLI::h2("System-Config");
    if (!file_exists(ROOT_DIR . '/config/system.json')) {

        CLI::p("System-Config not file found (`/config/system.json`). Will be created.");

        $params = getopt("", [
            'broadcast_service_uri_push::',
            'broadcast_service_uri_subscribe::'
        ]);

        $sysConf = new SystemConfig([
            'broadcastServiceUriPush' => $params['broadcast_service_uri_push'] ?? '',
            'broadcastServiceUriSubscribe' => $params['broadcast_service_uri_subscribe'] ?? ''
        ]);

        BroadcastService::setup($sysConf->broadcastServiceUriPush, $sysConf->broadcastServiceUriSubscribe);

        CLI::success("Provided arguments OK.");

        if (!file_put_contents(ROOT_DIR . '/config/system.json', json_encode($sysConf))) {

            throw new Exception("Could not write file `/config/system.json`. Check file permissions on `/config/`.");
        }

        CLI::p("System-Config file written.");

    } else {

        CLI::p("Config file present.");
    }


    CLI::h2("Database config");
    if (!file_exists(ROOT_DIR . '/config/DBConnectionData.json')) {

        CLI::p("Database-Config not file found (`/config/DBConnectionData.json`), will be created.");

        $config = new DBConfig(getopt("", [
            'host::',
            'port::',
            'dbname::',
            'user::',
            'password::',
            'salt::'
        ]));
        CLI::connectDBWithRetries($config, 5);

        CLI::success("Provided arguments OK.");

        if (!file_put_contents(ROOT_DIR . '/config/DBConnectionData.json', json_encode(DB::getConfig()))) {

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

    if ($args->overwrite_existing_installation) {

        CLI::warning("Clear database");
        $tablesDropped = $initDAO->clearDb();
        CLI::p("Tables dropped: " . implode(', ', $tablesDropped));
    }

    if ($args->overwrite_existing_installation or ($dbStatus['tables'] == 'empty')) {

        CLI::p("Install basic database structure");
        $initDAO->runFile(ROOT_DIR . "/scripts/sql-schema/mysql.sql");
    }

    $dbSchemaVersion = $initDAO->getDBSchemaVersion();
    $isCurrentVersion = Version::compare($dbSchemaVersion); // 1 : System is older than DB!, -1 : DB is outdated
    CLI::p("Database schema version is $dbSchemaVersion, system version is $systemVersion");
    if ($isCurrentVersion >= 0) {

       echo ": O.K.";

    } else {

        CLI::p("Install patches if necessary");
        $allowFailing = ($dbSchemaVersion === '0.0.0-no-table'); // TODO how about 0.0.0-no-value?
        $patchInstallReport = $initDAO->installPatches(ROOT_DIR . "/scripts/sql-schema/mysql.patches.d", $allowFailing);
        foreach ($patchInstallReport['patches'] as $patch) {

          if ($patchInstallReport['errors'][$patch]) {

              CLI::warning("* $patch: {$patchInstallReport['errors'][$patch]}");

          } else {

              CLI::success("* $patch: installed successfully.");
          }
        }
        if (count($patchInstallReport['errors']) and !$allowFailing) {

          throw new Exception('Installing database patches failed.' . print_r($patchInstallReport['errors'], true));
        }
    }

    $newDbStatus = $initDAO->getDbStatus();
    if (!($newDbStatus['tables'] == 'complete') and !$args->skip_db_integrity_check) {

        throw new Exception("Database integrity check failed: {$newDbStatus['message']}");
    }
    $initDAO->setDBSchemaVersion($systemVersion);
    CLI::success("DB passed integrity check.");


    CLI::h2("Workspaces");

    $initializer = new WorkspaceInitializer();

    if ($args->overwrite_existing_installation) {

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
        if (isset($workspaceData['restored'])) {
            CLI::warning("Workspace-folder found `ws_{$workspaceData['id']}` and restored in DB.");
        } else {
            CLI::p("Workspace `{$workspaceData['name']}` found.");
        }
    }

    if (!count($workspaceIds) and $args->workspace) {

        $sampleWorkspaceId = $initDAO->createWorkspace($args->workspace);

        CLI::success("Sample Workspace `{$args->workspace}` as `ws_{$sampleWorkspaceId}` created");

        $initializer->importSampleData($sampleWorkspaceId);
        CLI::success("Sample content files created.");

        $workspaceIds[] = $sampleWorkspaceId;
    }

    if (!file_exists(DATA_DIR)) {
      mkdir(DATA_DIR);
    }

    CLI::h2("Sys-Admin");
    if (!$initDAO->adminExists()) {

        CLI::warning("No Sys-Admin found.");

        $adminId = $initDAO->createAdmin($args->user_name, $args->user_password);
        CLI::success("Sys-Admin created: `$args->user_name`.");

        foreach ($workspaceIds as $workspaceId) {

            $initDAO->addWorkspaceToAdmin($adminId, $workspaceId);
            CLI::p("Workspace `ws_$workspaceId` added to `$args->user_name`.");
        }

    } else {

        CLI::p("At least one Sys-Admin found; nothing to do.");
    }


    CLI::h3("Ready.");

} catch (Exception $e) {

    CLI::error($e->getMessage());
    echo "\n";
    ErrorHandler::logException($e, true);
    exit(1);
}

echo "\n";
exit(0);
