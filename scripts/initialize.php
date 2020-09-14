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

require_once(ROOT_DIR . '/autoload.php');

class FinishOkay extends Exception {};

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

    echo "\n Sys-Config";
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

        echo "\nProvided arguments OK.";

        if (!file_put_contents(ROOT_DIR . '/config/system.json', json_encode($sysConf))) {

            throw new Exception("Could not write file `/config/system.json`. Check file permissions on `/config/`.");
        }

        echo "\nSystem-Config file written.";
    }

    echo "\n# Database config";
    if (!file_exists(ROOT_DIR . '/config/DBConnectionData.json')) {

        echo "\n Database-Config not file found (`/config/DBConnectionData.json`). "
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
        DB::connectWithRetries($config, 5);

        echo "\nProvided arguments OK.";

        if (!file_put_contents(ROOT_DIR . '/config/DBConnectionData.json', json_encode(DB::getConfig()))) {

            throw new Exception("Could not write file. Check file permissions on `/config/`.");
        }

        echo "\nDatabase-Config file written.";

    } else {

        DB::connectWithRetries(null, 5);
        $config = DB::getConfig();
        echo "\nConfig file present.";
    }

    $initDAO = new InitDAO();

    echo "\n# Database structure";

    $dbStatus = $initDAO->getDbStatus();
    if ($dbStatus['missing'] or $dbStatus['used']) {

        echo "\n {$dbStatus['message']}";

        if ((!$args->overwrite_existing_installation) and $dbStatus['used']) {

            throw new FinishOkay("{$dbStatus['used']} tables in use.");
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
        $dbStatus = $initDAO->getDbStatus();
        if ($dbStatus['missing'] or $dbStatus['used']) {
            throw new Exception("Database installation failed: {$dbStatus['message']}");
        }
    }

    echo "\n# Sample content";

    $workspace = new Workspace(1);
    $filesInWorkspace = array_reduce($workspace->countFilesOfAllSubFolders(), function($carry, $item) {
        return $carry + $item;
    }, 0);

    if (($filesInWorkspace > 0) and !$args->overwrite_existing_installation) {

        throw new FinishOkay("Workspace folder `{$workspace->getWorkspacePath()}` is not empty.");
    }

    $newIds = $initDAO->createWorkspaceAndAdmin(
        $args->user_name,
        $args->user_password,
        $args->workspace
    );
    echo "\n Super-Admin-User `{$args->user_name}` created";

    $initializer = new WorkspaceInitializer();
    echo "\n Workspace `{$args->workspace}` as `ws_1` created";

    $initializer->cleanWorkspace($newIds['workspaceId']);
    echo "\n {$filesInWorkspace} files in workspace-folder found and DELETED.";

    $initializer->importSampleData($newIds['workspaceId'], $args);
    echo "\n Sample XML files created.";


    if ($args->create_test_sessions) {

        $firstCode = explode(" ", $args->test_person_codes)[0];
        $initDAO->createSampleLoginsReviewsLogs($firstCode);
        $initDAO->createSampleExpiredSessions($firstCode);
        $initDAO->createSampleMonitorSessions();
        echo "\n Sample sessions created";
    }

    echo "\n\n# Ready. Parameters:";
    foreach ($args as $key => $value) {
        echo "\n $key: $value";
    }

} catch (FinishOkay $ok) {

    echo "\n #Abort initialization, data present: " . $ok->getMessage();

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
