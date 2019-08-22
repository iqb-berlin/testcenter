#!/usr/bin/php
<?php
$args = getopt("n:p:", array('user_name:', 'user_password:'));

try  {

    if (!isset($args['user_name'])) {
        throw new Exception("user name not provided. use: --user_name=...");
    }

    if (!isset($args['user_password'])) {
        throw new Exception("password not provided. use: --user_password=...");
    }

    if (strlen($args['user_password']) < 7) {
        throw new Exception("Password must eb at least 7 characters long!");
    }

    echo "Create super user `{$args['user_name']}`` with password `" . substr($args['user_password'],0 ,4) . "***` ... ";

    require_once(realpath(dirname(__FILE__)) . '/../vo_code/DBConnection.php');
    require_once "dbUserCreator.class.php";

    $config_file_path = realpath(dirname(__FILE__)) . '/../vo_code/DBConnectionData.json';

    if (!file_exists($config_file_path)) {
        throw new Exception("DB-config file is missing!");
    }

    $config = file_get_contents($config_file_path);

    if (!json_decode($config)) {
        throw new Exception("DB-config file is malformed json:\n$config");
    }

    $dbc = new dbUserCreator();
    if ($dbc->isError()) {
        throw new Exception($dbc->errorMsg);
    }
    $dbc->addSuperuser($args['user_name'], $args['user_password']);

} catch (Exception $e) {
    echo("\nError: " . $e->getMessage() . "\n");
    if (isset($config)) {
        echo "\nconfig:\n$config";
    }
    exit(1);
}

echo "success.";
echo "\n";
exit(0);
