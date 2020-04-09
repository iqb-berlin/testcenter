<?php
define('ROOT_DIR', realpath(dirname(__FILE__) . '/..'));
define('DATA_DIR', ROOT_DIR . '/vo_data');

require_once(ROOT_DIR . '/autoload.php');

$config_file_path = ROOT_DIR . '/config/DBConnectionData.json';

if (!file_exists($config_file_path)) {
    throw new Exception("DB-config file is missing!");
}

$config = file_get_contents($config_file_path);
$config = JSON::decode($config, true);
DB::connect(new DBConfig($config));

$initDao = new InitDAO();

echo "\n# DELETE TABLES\n";
echo $initDao->clearDb();

echo "\n# INSTALL DB\n";
$initDao->runFile(ROOT_DIR . '/scripts/sql-schema/postgresql.sql');
echo "\n# INSTALL Patches\n";
$initDao->runFile(ROOT_DIR . '/scripts/sql-schema/patches.postgresql.sql');

echo "\n# State of the DB\n";
echo $initDao->getDBContentDump();


