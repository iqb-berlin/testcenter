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
 *
 * if you want to create a workspace with sample data as well, provide:
 * --workspace=(workspace name)
 * --test_login_name=(login for the sample test booklet)
 * --test_login_password=(login for the sample test booklet)
 *
 * you may add, otherwise they will be random person codes
 * --test_person_codes=one,two,three
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

$args = getopt("", [
    'user_name:',
    'user_password:',
    'workspace:',
    'test_login_name:',
    'test_login_password:',
    'test_person_codes::'
]);

try  {

    if (!isset($args['user_name'])) {
        throw new Exception("user name not provided. use: --user_name=...");
    }

    if (!isset($args['user_password'])) {
        throw new Exception("password not provided. use: --user_password=...");
    }

    if (strlen($args['user_password']) < 7) {
        throw new Exception("Password must have at least 7 characters!");
    }

    $config_file_path = ROOT_DIR . '/config/DBConnectionData.json';

    if (!file_exists($config_file_path)) {
        throw new Exception("DB-config file is missing!");
    }

    $config = file_get_contents($config_file_path);

    $config = JSON::decode($config, true);

    DB::connect(new DBConfig($config));

    $initializer = new WorkspaceInitializer();

    try {
        $initDAO = new InitDAO();
    } catch (Throwable $t) {
        $retries = 5;
        $error = true;
        while ($retries-- && $error) {
            try {
                $initializer = new WorkspaceInitializer();
                echo "Database connection failed... retry ($retries attempts left)\n";
                usleep(20 * 1000000); // give database container time to come up
                $error = false;
            } catch (Throwable $t) {
                $error = true;
            }
        }
    }

    $newIds = $initDAO->createWorkspaceAndAdmin(
        $args['user_name'],
        $args['user_password'],
        $args['workspace']
    );

    if (!isset($args['test_person_codes']) or !$args['test_person_codes']) {
        $loginCodes = $initializer->getLoginCodes();
    } else {
        $loginCodes = explode(',', $args['test_person_codes']);
    }

    $args['test_person_codes'] = implode(" ", $loginCodes);

    $initializer->importSampleData($newIds['workspaceId'], $args);

//    $initDAO->createSampleLoginsReviewsLogs($loginCodes[0]);

    echo "Sample data parameters: \n";
    echo implode("\n", array_map(function($param_key) use ($args) {return "$param_key: {$args[$param_key]}";}, array_keys($args)));


} catch (Exception $e) {
    ErrorHandler::logException($e, false);
    fwrite(STDERR,"\n" . $e->getMessage() . "\n");
    if (isset($config)) {
        echo "\nconfig:\n" . print_r($config, true);
    }
    exit(1);
}

echo "\n";
exit(0);
