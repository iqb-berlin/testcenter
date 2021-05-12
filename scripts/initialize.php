#!/usr/bin/php
<?php
/**
 * CLi script to initialize app
 *
 * creates a super user (if no user exists already)
 * creates also a workspace (if non exists)
 *
 * usage:
 * --user_name=(super user name)
 * --user_password=(super user password)
 * --workspace=(workspace name)
 * --test_login_name=(login for the sample test booklet)
 * --test_login_password=(login for the sample test booklet)
 *
 * you may add, otherwise they will be random person codes
 * --test_person_codes=one,two,three
 *
 * if you add
 * --overwrite_existing_installation=true
 *
 * existing database tables and files will be overwritten!
 *
 * /config/DBConnectionData.json hat to be present OR you can provide connection data yourself
 * --type=(`mysql` or `pgsql`)
 * --host=(mostly `localhost`)
 * --post=(usually 3306 for mysql and 5432 for postgresl)
 * --dbname=(database name)
 * --user=(mysql-/postgresql-username)
 * --password=(mysql-/postgresql-password)
 *
 * /config/system.json as well. you can write the file yourself or ass parameters
 * --broadcastServiceUriPush=(address of broadcast service to push for the backend)
 * --broadcastServiceUriSubscribe=(address of broadcast service to subscribe to from frontend)
 * Add them with empty strings if you don't want to use the broadcast service at all.
 *
 *
 * Note: run this script as a user who can create files which can be read by the webserver or change file rights after wards
 * for example: sudo --user=www-data php scripts/initialize.php --user_name=a --user_password=x123456

 */


if (php_sapi_name() !== 'cli') {

    header('HTTP/1.0 403 Forbidden');
    echo "This is only for usage from command line.";
    exit(1);
}

define('ROOT_DIR', realpath(dirname(__FILE__) . '/..'));
define('DATA_DIR', ROOT_DIR . '/vo_data');

$E = "\n\e[0;31m";
$N = "\e[0m\n";

require_once(ROOT_DIR . '/autoload.php');

try  {

    $args = new InstallationArguments(getopt("", [
        'user_name::',
        'user_password::',
        'workspace::',
        'test_login_name::',
        'test_login_password::',
        'test_person_codes::',
        'overwrite_existing_installation::',
        'skip_db_integrity_check::'
    ]));

    $systemVersion = Version::get();
    echo "$E# IQB TESTCENTER BACKEND $systemVersion{$N}";

    echo "\n# System-Config";
    if (!file_exists(ROOT_DIR . '/config/system.json')) {

        echo "\n System-Config not file found (`/config/system.json`). Will be created.";

        $params = getopt("", [
            'broadcast_service_uri_push::',
            'broadcast_service_uri_subscribe::'
        ]);

        $sysConf = new SystemConfig([
            'broadcastServiceUriPush' => $params['broadcast_service_uri_push'] ?? '',
            'broadcastServiceUriSubscribe' => $params['broadcast_service_uri_subscribe'] ?? ''
        ]);

        BroadcastService::setup($sysConf->broadcastServiceUriPush, $sysConf->broadcastServiceUriSubscribe);

        echo "\n Provided arguments OK.";

        if (!file_put_contents(ROOT_DIR . '/config/system.json', json_encode($sysConf))) {

            throw new Exception("Could not write file `/config/system.json`. Check file permissions on `/config/`.");
        }

        echo "\n System-Config file written.";

    } else {

        echo "\n Config file present.";
    }


    echo "\n# Database config";
    if (!file_exists(ROOT_DIR . '/config/DBConnectionData.json')) {

        echo "\n Database-Config not file found (`/config/DBConnectionData.json`), will be created.";

        $config = new DBConfig(getopt("", [
            'type::',
            'host::',
            'port::',
            'dbname::',
            'user::',
            'password::',
        ]));
        DB::connectWithRetries($config, 5);

        echo "\n Provided arguments OK.";

        if (!file_put_contents(ROOT_DIR . '/config/DBConnectionData.json', json_encode(DB::getConfig()))) {

            throw new Exception("Could not write file. Check file permissions on `/config/`.");
        }

        echo "\n Database-Config file written.";

    } else {

        DB::connectWithRetries(null, 5);
        $config = DB::getConfig();
        echo "\n Config file present.";
    }


    echo "\n# Database Structure";
    $initDAO = new InitDAO();

    if ($config->type !== "mysql") {

        throw new Exception("Database Type {$config->type} not supported. This script only supports MySQL.");
    }

    $dbStatus = $initDAO->getDbStatus();
    echo "\n Database status: {$dbStatus['message']}";

    if ($args->overwrite_existing_installation) {

        echo "\n Clear database";
        $tablesDropped = $initDAO->clearDb();
        echo "\n Tables dropped: " . implode(', ', $tablesDropped);
    }

    if ($args->overwrite_existing_installation or ($dbStatus['tables'] == 'empty')) {

        echo "\n Install basic database structure";
        $initDAO->runFile(ROOT_DIR . "/scripts/sql-schema/mysql.sql");
    }

    $dbSchemaVersion = $initDAO->getDBSchemaVersion();
    $isCurrentVersion = Version::compare($dbSchemaVersion); // 1 : System is older than DB!, -1 : DB is outdated
    echo "\n Database schema version is $dbSchemaVersion, system version is $systemVersion";
    if ($isCurrentVersion >= 0) {

       echo ": O.K.";

    } else {

        echo "\n Install patches if necessary";
        $allowFailing = ($dbSchemaVersion === '0.0.0-no-table'); // TODO how about 0.0.0-no-value?
        $patchInstallReport = $initDAO->installPatches(ROOT_DIR . "/scripts/sql-schema/mysql.patches.d", $allowFailing);
        foreach ($patchInstallReport['patches'] as $patch) {

          echo "\n * $patch: " . ($patchInstallReport['errors'][$patch] ?? 'installed successfully.');
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
    echo "\n DB passed integrity check.";


    echo "\n# Workspaces";

    $initializer = new WorkspaceInitializer();

    if ($args->overwrite_existing_installation) {

        foreach (Workspace::getAll() as /* @var $workspace Workspace */ $workspace) {
            $filesInWorkspace = array_reduce($workspace->countFilesOfAllSubFolders(), function ($carry, $item) {
                return $carry + $item;
            }, 0);

            $initializer->cleanWorkspace($workspace->getId());
            echo "\n Workspace-folder `ws_{$workspace->getId()}` was DELETED. It contained {$filesInWorkspace} files.";

            Folder::deleteContentsRecursive($workspace->getWorkspacePath());
        }
    }

    $workspaceIds = [];

    foreach (Workspace::getAll() as /* @var $workspace Workspace */ $workspace) {

        $workspaceData = $initDAO->createWorkspaceIfMissing($workspace);
        $workspaceIds[] = $workspaceData['id'];
        if (isset($workspaceData['restored'])) {
            echo "\n Workspace-folder found `ws_{$workspaceData['id']}` and restored in DB.";
        } else {
            echo "\n Workspace `{$workspaceData['name']}` found.";
        }
    }

    if (!count($workspaceIds) and $args->workspace) {

        $sampleWorkspaceId = $initDAO->createWorkspace($args->workspace);

        echo "\n Sample Workspace `{$args->workspace}` as `ws_{$sampleWorkspaceId}` created";

        $initializer->importSampleData($sampleWorkspaceId, $args);
        echo "\n Sample content files created.";

        $workspaceIds[] = $sampleWorkspaceId;
    }


    echo "\n# Sys-Admin";
    if (!$initDAO->adminExists()) {

        echo "\n No Sys-Admin found.";

        $adminId = $initDAO->createAdmin($args->user_name, $args->user_password);
        echo "\n Sys-Admin created: `$args->user_name`.";

        foreach ($workspaceIds as $workspaceId) {

            $initDAO->addWorkspaceToAdmin($adminId, $workspaceId);
            echo "\n Workspace `ws_$workspaceId` added to `$args->user_name`.";
        }

    } else {

        echo "\n At least one Sys-Admin found; nothing to do.";
    }


    echo "\n\n# Ready. Parameters:";
    foreach ($args as $key => $value) {
        echo "\n $key: $value";
    }

} catch (Exception $e) {

    fwrite(STDERR,"\n" . $e->getMessage() . "\n");
    if (isset($config)) {
        echo "\n DB-Config:\n" . print_r($config, true);
    }

    echo "\n\n";
    ErrorHandler::logException($e, true);
    exit(1);
}

echo "\n";
exit(0);
