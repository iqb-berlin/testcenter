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
require_once(realpath(dirname(__FILE__)) . '/../autoload.php');

$args = getopt("", array(
    'user_name:',
    'user_password:',
    'workspace:',
    'test_login_name:',
    'test_login_password:'
));

try  {

    if (isset($args['apache_user'])) {
        define('APACHE_USER', $args['apache_user']);
    }

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

    JSON::decode($config);

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

    if ($initDAO->addSuperuser($args['user_name'], $args['user_password'])) {
        echo "Superuser `{$args['user_name']}`` with password `" . substr($args['user_password'],0 ,4) . "***` created successfully.\n";
    }

    if (isset($args['workspace'])) {

        $workspaceId = $initDAO->getWorkspace($args['workspace']);

        $initDAO->grantRights($args['user_name'], $workspaceId);

        $loginCodes = $initializer->getLoginCodes();
        $args['test_person_codes'] = implode(" ", $loginCodes);

        $initializer->importSampleData($workspaceId, $args);
        echo "Sample data parameters: \n";
        echo implode("\n", array_map(function($param_key) use ($args) {return "$param_key: {$args[$param_key]}";}, array_keys($args)));

        $initializer->createSampleLoginsReviewsLogs($loginCodes[0]);
    }

} catch (Exception $e) {
    fwrite(STDERR,"\n" . $e->getMessage() . "\n");
    if (isset($config)) {
        echo "\nconfig:\n$config";
    }
    exit(1);
}

echo "\n";
exit(0);
