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

require_once(ROOT_DIR . '/autoload.php');

try  {

    $args = new InstallationArguments(getopt("", [
        'user_name:',
        'user_password:',
        'workspace:',
        'test_login_name:',
        'test_login_password:',
        'test_person_codes::',
        'create_test_sessions::',
        'overwrite_existing_installation::',
    ]));

    echo "\n# Database config";
    if (!file_exists(ROOT_DIR . '/config/DBConnectionData.json')) {

        echo "\n Config not file found (`/config/DBConnectionData.json`). "
         . "\nCreate it manually of provide arguments: "
         . "\n--type=(`mysql` or `pgsql`): "
         . "\n--host=(mostly `localhost`)"
         . "\n--post=(ususally 3306 for mysql and 5432 for postgresl)"
         . "\n--dbname=(database name)"
         . "\n--user=(mysql-/postgresql-username)"
         . "\n--password=(mysql-/postgresql-password)";

        $config = new DBConfig(getopt("", [
            'type::',
            'host::',
            'port::',
            'dbname::',
            'user::',
            'password::',
        ]));
        DB::connect($config);
        $initDAO = InitDAO::createWithRetries(5);

        echo "\nProvided arguments OK.";

        if (!file_put_contents(ROOT_DIR . '/config/DBConnectionData.json', json_encode(DB::getConfig()))) {

            throw new Exception("Could nto write file. Check file permissions on `/config/`.");
        }

        echo "\nConfig file written.";

    } else {

        DB::connect();
        $config = DB::getConfig();
        echo "\nConfig file present.";
        $initDAO = InitDAO::createWithRetries(5);
    }

    echo "\n# Database structure";

    if ($notReadyMsg = $initDAO->isDbNotReady()) {

        echo "\n $notReadyMsg";

        if (!$args->overwrite_existing_installation) {

            throw new Exception("set --overwrite_existing_installation to true or set up manually a correct and empty database.");
        }

        echo $initDAO->clearDb();
        echo "\n Install Database structure";
        $typeName = ($config->type == "mysql") ? 'mysql' : 'postgresql';
        $initDAO->runFile(ROOT_DIR . "/scripts/sql-schema/$typeName.sql");
        echo "\n Install Patches";
        $initDAO->runFile(ROOT_DIR . "/scripts/sql-schema/patches.$typeName.sql");
        echo "\n State of the DB";
        echo $initDAO->getDBContentDump();
        echo "\n";
        if ($notReadyMsg = $initDAO->isDbNotReady()) {
            throw new Exception("Database installation failed: $notReadyMsg");
        }
    }

    echo "\n# Sample content";

    $newIds = $initDAO->createWorkspaceAndAdmin(
        $args->user_name,
        $args->user_password,
        $args->workspace
    );

    echo "\n Super-Admin-User `{$args->user_name}` created";

    $initializer = new WorkspaceInitializer();

    echo "\n Workspace `{$args->workspace}` as `ws_1` created";

    $workspaceController = new WorkspaceController(1);
    $filesInWorkspace = array_reduce($workspaceController->countFilesOfAllSubFolders(), function($carry, $item) {
        return $carry + $item;
    }, 0);

    if (($filesInWorkspace > 0) and !$args->overwrite_existing_installation) {

        throw new Exception("Workspace folder `{$workspaceController->getWorkspacePath()}` is not empty.");
    }

    $initializer->cleanWorkspace($newIds['workspaceId']);

    echo "\n {$filesInWorkspace} files in workspace-folder found and DELETED.";

    $initializer->importSampleData($newIds['workspaceId'], $args);
    echo "\n Sample XML files created.";

    if ($args->create_test_sessions) {

        $firstCode = explode(" ", $args->test_person_codes)[0];
        $initDAO->createSampleLoginsReviewsLogs($firstCode);
        $initDAO->createSampleExpiredSessions($firstCode);
        $initDAO->createSampleMonitorSession();
        echo "\n Sample sessions created";
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
