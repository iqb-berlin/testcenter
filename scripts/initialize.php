#!/usr/bin/php
<?php
/**
 * CLi script to initialize app
 *
 * creates a super user (if no user exists allready)
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
 * Note: run this script as a user who can create files wich can be read by the webserver or change file rights after wards
 * for example: sudo --user=www-data php scripts/initialize.php --user_name=a --user_password=x123456

 */

include('index.php');

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

    require_once(realpath(dirname(__FILE__)) . '/../vo_code/DBConnectionSuperadmin.php');
    require_once "initializer.class.php";

    $config_file_path = realpath(dirname(__FILE__)) . '/../vo_code/DBConnectionData.json';

    if (!file_exists($config_file_path)) {
        throw new Exception("DB-config file is missing!");
    }

    $config = file_get_contents($config_file_path);

    if (!json_decode($config)) {
        throw new Exception("DB-config file is malformed JSON:\n$config");
    }

    $dbc = new Initializer();
    $retries = 5;
    while ($retries-- && $dbc->isError()) {
        $dbc = new Initializer();
        echo "Database connection failed... retry ($retries attempts left)\n";
        usleep(20 * 1000000); // give database container time to come up
    }
    if (($retries <= 0) and $dbc->isError()) {
        throw new Exception($dbc->errorMsg);
    }

    if ($dbc->addSuperuser($args['user_name'], $args['user_password'])) {
        echo "Superuser `{$args['user_name']}`` with password `" . substr($args['user_password'],0 ,4) . "***` created successfully.\n";
    }

    if (isset($args['workspace'])) {
        $workspace_id = $dbc->getWorkspace($args['workspace']);
        $dbc->grantRights($args['user_name'], $workspace_id);
        $dbc->importSampleData($workspace_id, $args);
    }

} catch (Exception $e) {
    echo("\nError: " . $e->getMessage() . "\n");
    if (isset($config)) {
        echo "\nconfig:\n$config";
    }
    exit(1);
}

echo "\n";
exit(0);
