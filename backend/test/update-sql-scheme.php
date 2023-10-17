<?php
define('ROOT_DIR', realpath(__DIR__ . '/../..'));
require_once(ROOT_DIR . '/backend/vendor/autoload.php');
require_once 'unit/TestDB.class.php';
SystemConfig::readFromEnvironment();
TestDB::setUp();