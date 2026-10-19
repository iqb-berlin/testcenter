<?php

define('ROOT_DIR', realpath(__DIR__ . '/../../..'));
set_include_path(realpath(__DIR__ . '/..'));
require_once ROOT_DIR . "/backend/vendor/autoload.php";

// only the database connection comes from the environment, so the developer's .env.dev does not
// change how the tests behave
SystemConfig::apply([
  'database' => SystemConfig::readDatabaseEnvironment(),
  'password' => ['salt' => 't', 'min_length' => 7, 'pattern' => '^.*$'],
  'admin' => ['init_password' => 'user123'],
  'login' => ['requirePassword' => false],
  'cacheServer' => ['host' => '', 'port' => 6379, 'password' => ''],
  'bruteForceProtection' => ['sessions' => []],
  'server' => ['key' => 'Secret'],
  'xmlSchema' => ['validation' => true],
  'debug' => ['allowTestMode' => false]
]);
